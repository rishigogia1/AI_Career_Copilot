import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateContentWithAI, generateContentWithAI_Robust } from "../utils/geminiClient.js";
import { parseResume } from "../utils/parseResume.js";
import { extractResumeData } from "../utils/extractData.js";
import { buildResumeTailorPrompt, buildCorrectiveTailorPrompt } from "../prompts/resumeTailorPrompt.js";
import { mergeResumeDiff } from "../utils/diffMerger.js";
import Workspace from "../models/Workspace.js";
import { isMongoConnected, inMemoryDB, saveInMemoryDB } from "../config/db.js";
import crypto from "crypto";
import { matchResumeWithJD_ATS, matchResumeWithJD_ATS_Reuse } from "../utils/atsEngine.js";
import { validateResumeIntegrity } from "../utils/tailorVerifier.js";
import { extractProtectedKeywords, calculateProtectedKeywordPenalty } from "../utils/protectedKeywords.js";
import { buildOptimizationPlan } from "../utils/optimizationPlanner.js";
import { analyzeResumeDiff } from "../utils/diffAnalyzer.js";
import { calculateQualityScore } from "../utils/qualityScorer.js";
import { generateRecommendationReport } from "../utils/recommendationEngine.js";
import { criticizeResume } from "../utils/resumeCritic.js";
import { getOrCreateWorkspace, persistWorkspace } from "../utils/workspaceUtils.js";
let genAI = null;
const initGemini = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const evaluateCandidate = ({ baselineMatch, candidateMatch, adjustedScore, penaltyResult, verification }) => {
  if (!verification.valid) {
    return { accepted: false, reason: "Failed integrity verification: " + verification.reasons.join(", ") };
  }
  
  const baselineScore = baselineMatch.finalScore;
  
  if (adjustedScore > baselineScore) {
    return { accepted: true, reason: `Adjusted score (${adjustedScore}%) is higher than baseline (${baselineScore}%).` };
  }

  if (adjustedScore === baselineScore) {
    const keywordDelta = candidateMatch.matchedSkills.length - baselineMatch.matchedSkills.length;
    const protectedKeywordLoss = penaltyResult.missingKeywords.length;

    if (candidateMatch.semanticScore >= baselineMatch.semanticScore && keywordDelta > 0 && protectedKeywordLoss === 0) {
      return { accepted: true, reason: `Score matches baseline (${baselineScore}%), but improved semantics and keywords.` };
    }
    
    return { accepted: false, reason: `Score matches baseline (${baselineScore}%), but failed secondary quality checks (Semantic: ${candidateMatch.semanticScore} vs ${baselineMatch.semanticScore}, KeywordDelta: ${keywordDelta}, ProtectedLoss: ${protectedKeywordLoss}).` };
  }

  return { accepted: false, reason: `Adjusted score (${adjustedScore}%) is lower than baseline (${baselineScore}%).` };
};

const extractProfileWithGemini = async (resumeText) => {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      console.log("⚠️ No AI API keys configured, skipping profile extraction");
      return null;
    }

    const prompt = `You are an expert resume parser. Your job is to extract 
                personal profile information from the resume text.
                Extract:
                - fullName (the candidate's full name, if not found set to "")
                - email (candidate's email, if not found set to "")
                - linkedin (URL link to LinkedIn, if not found set to "")
                - github (URL link to GitHub, if not found set to "")
                - portfolio (URL link to personal website or portfolio, if not found set to "")
                
                Return ONLY a JSON object.
                No explanation, no markdown, no extra text.
                Example: {"fullName": "Jane Doe", "email": "jane@example.com", "linkedin": "https://linkedin.com/in/janedoe", "github": "https://github.com/janedoe", "portfolio": ""}
                
                Resume text:
                ${resumeText.substring(0, 3000)}`;

    const content = await generateContentWithAI(prompt, "gemini-2.5-flash");
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error("Gemini profile extraction failed:", error.message);
    return null;
  }
};

// Gemini-based skill extraction
const extractSkillsWithGemini = async (resumeText) => {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      console.log("⚠️ No AI API keys configured, skipping Gemini extraction");
      return null;
    }

    const prompt = `You are an expert resume parser. Your job is to extract 
                technical skills, tools, frameworks, programming languages, 
                and technologies from resume text.
                Be strict — only extract what is explicitly mentioned.
                Do not infer, assume or add anything not written in the resume.
                
                Extract all technical skills from this resume. Include:
                - Programming languages
                - Frameworks and libraries
                - Tools and platforms
                - Databases
                - Cloud services
                - AI/ML technologies
                - CS concepts (DSA, OOPs, System Design etc)
                
                Return ONLY a JSON array of lowercase strings.
                No explanation, no markdown, no extra text.
                Example: ["python", "react", "mongodb", "docker"]
                
                Resume text:
                ${resumeText.substring(0, 3000)}`;

    const content = await generateContentWithAI(prompt, "gemini-2.5-flash");
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log("✅ Gemini extracted skills:", parsed);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Gemini skill extraction failed:", error.message);
    return null;
  }
};

export const uploadResumeController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const text = await parseResume(filePath);
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Could not extract text from resume" });
    }

    console.log("✅ Resume text extracted, length:", text.length);

    const structuredData = extractResumeData(text);
    console.log("✅ Structured data extracted");

    let gptSkills = null;
    let extractedProfile = null;

    try {
      [gptSkills, extractedProfile] = await Promise.all([
        extractSkillsWithGemini(text),
        extractProfileWithGemini(text)
      ]);
    } catch (e) {
      console.warn("⚠️ Parallel Gemini extraction failed:", e.message);
    }

    if (gptSkills && gptSkills.length > 0) {
      structuredData.skills = gptSkills;
      console.log("✅ Using Gemini extracted skills:", gptSkills);
    } else {
      console.log("⚠️ Using hardcoded skill extraction");
    }

    // Transactional Workspace Persistence
    const userId = req.userId;
    const workspace = await getOrCreateWorkspace(userId);
    
    // Convert to CanonicalResume structure
    workspace.resume = {
      original: {
        version: 1,
        uploaded: true,
        fileName: req.file.originalname,
        uploadedAt: new Date().toLocaleString(),
        rawText: text,
        structuredData: {
          skills: structuredData.skills || [],
          education: structuredData.education || "",
          projects: structuredData.projects || "",
          experience: structuredData.experience || "",
          extractedProfile
        }
      },
      optimized: null,
      activeVersion: "original"
    };

    const persistedWorkspace = await persistWorkspace(userId, workspace);

    res.json({
      success: true,
      message: "Resume uploaded and persisted successfully",
      workspace: persistedWorkspace,
      metadata: {
        workspaceVersion: persistedWorkspace.version,
        updatedAt: persistedWorkspace.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Resume upload error:", error.message);
    res.status(500).json({ 
      message: error.message || "Failed to process resume"
    });
  }
};

// Memory cache for tailored requests (SHA256 request hashing)
const tailorResponseCache = new Map();

// Helpers removed in favor of getOrCreateWorkspace

export const tailorResumeController = async (req, res) => {
  const startTime = Date.now();
  const userId = req.userId;
  
  try {
    const { resumeText, jobDescription, missingSkills = [], missingKeywords = [] } = req.body;
    
    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PARAMETERS",
        message: "Resume text and job description are required"
      });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "AI_KEYS_NOT_CONFIGURED",
        message: "AI API keys not configured. Cannot tailor resume."
      });
    }

    // 1. Request Hashing
    const hashInputs = [
      resumeText.trim(),
      jobDescription.trim(),
      JSON.stringify(missingSkills),
      JSON.stringify(missingKeywords)
    ].join("|");
    const requestHash = crypto.createHash("sha256").update(hashInputs).digest("hex");

    if (tailorResponseCache.has(requestHash)) {
      const cached = tailorResponseCache.get(requestHash);
      const totalTime = Date.now() - startTime;
      
      console.log(`\n========================================\n[TAILOR] Request Cache HIT (Total Time: ${totalTime}ms)\n========================================\n`);

      const responsePayload = {
        success: true,
        ...cached,
        message: cached.optimizationRejected ? "Optimization Rejected (Original Preserved)" : "Resume tailored successfully (Cached)",
      };

      if (process.env.NODE_ENV !== "production") {
        responsePayload.diagnostics = {
          ...cached.diagnostics,
          cacheHit: "HIT",
          totalTime: `${totalTime}ms`,
        };
      }
      return res.status(200).json(responsePayload);
    }

    // 2. Cache Validation & Parallel loading
    console.log("[TAILOR STEP 1] Controller entered");
    console.log("[TAILOR STEP 2] User:", userId);
    
    let resumeParsedOnTheFly = false;
    let workspace = null;
    let resumeJSON = null;

    console.log("[TAILOR STEP 3] Loading workspace");
    workspace = await getOrCreateWorkspace(userId);
    console.log("[TAILOR STEP 4] Workspace loaded");
    console.log("[TAILOR STEP 5] Resume exists:", !!workspace?.resume);
    const hasJD = !!workspace?.jobDescription || !!workspace?.analyses?.jobDesc;
    console.log("[TAILOR STEP 6] Job description exists:", hasJD);

    // Support both canonical and legacy schema
    const resumeData = workspace && workspace.resume?.original ? workspace.resume.original.structuredData : workspace?.resume;

    if (workspace && (workspace.resume?.original?.uploaded || workspace.resume?.uploaded) && resumeData?.projects && resumeData?.experience) {
      resumeJSON = {
        skills: resumeData.skills || [],
        education: resumeData.education || "",
        projects: resumeData.projects || "",
        experience: resumeData.experience || "",
        extractedProfile: resumeData.extractedProfile || null
      };
    } else {
      console.log("⚠️ Cache missing structure, parsing resume text on-the-fly...");
      resumeParsedOnTheFly = true;
      const structuredData = extractResumeData(resumeText);
      let extractedProfile = null;
      try {
        extractedProfile = await extractProfileWithGemini(resumeText);
      } catch (e) {
        console.error("Gemini profile extraction failed on-the-fly:", e.message);
      }

      resumeJSON = {
        skills: structuredData.skills || [],
        education: structuredData.education || "",
        projects: structuredData.projects || "",
        experience: structuredData.experience || "",
        extractedProfile
      };

      if (workspace) {
        workspace.resume = {
          ...workspace.resume,
          skills: structuredData.skills,
          education: structuredData.education,
          projects: structuredData.projects,
          experience: structuredData.experience,
          extractedProfile
        };
        await persistWorkspace(userId, workspace);
      }
    }

    // 3. Establish Baseline ATS Score
    const baselineMatch = await matchResumeWithJD_ATS({
      resumeText,
      resumeSkills: resumeJSON.skills || [],
      jobDescription
    });
    const baselineScore = baselineMatch.finalScore;
    console.log(`[QUALITY GATE] Baseline ATS Match Score: ${baselineScore}%`);

    // Run Critic Stage
    const criticReport = criticizeResume({
      baselineMatch,
      resumeText,
      jobDescription
    });

    // Extract Protected Keywords and build Optimization Plan
    const protectedKeywords = extractProtectedKeywords(baselineMatch.matchedSkills, resumeText);
    console.log(`[QUALITY GATE] Extracted Protected Keywords: ${protectedKeywords.join(", ")}`);

    const optimizationPlan = buildOptimizationPlan({
      baselineMatch,
      resumeJSON,
      resumeText,
      jobDescription,
      criticReport
    });
    console.log("[QUALITY GATE] Created optimization plan strategies:", JSON.stringify(optimizationPlan, null, 2));

    // Store extraction to reuse for candidate attempts
    const baselineDataForReuse = {
      extractedResumeData: baselineMatch.debug?.extractedResumeData || {},
      extractedJDData: baselineMatch.debug?.extractedJDData || {},
      domainResume: baselineMatch.debug?.domainDetection?.domainResume || { domain: "Other" },
      domainJD: baselineMatch.debug?.domainDetection?.domainJD || { domain: "Other" }
    };

    // 4. Run tailoring with up to 3 attempts and per-attempt tracking
    const MAX_ATTEMPTS = 3;
    const attemptLogs = []; // Per-attempt diagnostics
    let acceptedResult = null; // Only set if an attempt passes the quality gate
    let geminiTime = 0;
    let lastDiffReport = null;
    let lastQualityScores = null;
    let lastCandidateMatch = null;
    let lastPreviousDiff = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let activePrompt;
      let structuredFeedback = null;
      
      if (attempt === 1) {
        activePrompt = buildResumeTailorPrompt(resumeJSON, jobDescription, missingSkills, protectedKeywords, optimizationPlan);
      } else {
        const lastLog = attemptLogs[attemptLogs.length - 1];
        
        structuredFeedback = {
          attempt,
          baselineATS: baselineScore,
          candidateATS: lastLog.score,
          adjustedScore: lastLog.adjustedScore,
          lostKeywords: lastLog.keywordsRemoved || [],
          protectedKeywordsMissing: lastLog.protectedKeywordsMissing || [],
          sectionsToEdit: optimizationPlan.weakSections.map(s => s.section),
          sectionsLocked: ["education"]
        };
        
        activePrompt = buildCorrectiveTailorPrompt(
          resumeJSON,
          jobDescription,
          missingSkills,
          structuredFeedback,
          protectedKeywords,
          optimizationPlan,
          lastPreviousDiff
        );
        
        console.log(`[QUALITY GATE] Attempt ${attempt} prompt diagnostics:`);
        console.log(`  Protected keywords in prompt: ${protectedKeywords.length}`);
        console.log(`  Structured feedback keys: ${Object.keys(structuredFeedback).join(", ")}`);
        console.log(`  Previous diff included: ${!!lastPreviousDiff}`);
        console.log(`  Prompt length: ${activePrompt.length} chars`);
      }

      let parsedDiff = null;
      const geminiStart = Date.now();
      
      try {
        console.log(`[TAILOR STEP 7] Calling AI (Attempt ${attempt})`);
        const response = await generateContentWithAI_Robust(activePrompt, "gemini-2.5-flash");
        console.log(`[TAILOR STEP 8] AI Response received`);
        const attemptGeminiTime = Date.now() - geminiStart;
        geminiTime += attemptGeminiTime;
        
        const cleaned = response.content.replace(/```json|```/g, "").trim();
        const firstOpen = cleaned.indexOf('{');
        const lastClose = cleaned.lastIndexOf('}');
        if (firstOpen === -1 || lastClose === -1 || lastClose <= firstOpen) {
          throw new Error("Invalid JSON structure returned by Gemini");
        }
        parsedDiff = JSON.parse(cleaned.substring(firstOpen, lastClose + 1));
        lastPreviousDiff = parsedDiff;
      } catch (err) {
        console.warn(`⚠️ Attempt ${attempt} failed to parse or generate:`, err.message);
        attemptLogs.push({
          attempt,
          score: 0,
          adjustedScore: 0,
          skillScore: 0,
          semanticScore: 0,
          status: "error",
          error: err.message,
          keywordsAdded: [],
          keywordsRemoved: [],
          sectionsModified: [],
          protectedKeywordsMissing: [],
          integrityValid: false
        });
        continue;
      }

      // Strip hallucinated skills
      if (parsedDiff.skills) {
        console.log(`[QUALITY GATE] Stripping AI-injected skills array to prevent hallucination.`);
        parsedDiff.skills = null;
      }

      const candidateResume = mergeResumeDiff(resumeText, parsedDiff, resumeJSON);

      // Light integrity validation
      const verification = validateResumeIntegrity({
        originalText: resumeText,
        candidateText: candidateResume
      });

      if (!verification.valid) {
        console.log(`[QUALITY GATE] Attempt ${attempt}: REJECTED at Integrity Validator. Reasons:`, verification.reasons);
        attemptLogs.push({
          attempt,
          score: 0,
          adjustedScore: 0,
          skillScore: 0,
          semanticScore: 0,
          status: "rejected (integrity validator)",
          keywordsAdded: [],
          keywordsRemoved: [],
          sectionsModified: [],
          protectedKeywordsMissing: [],
          integrityValid: false,
          verificationReasons: verification.reasons
        });
        continue;
      }

      // Score candidate resume
      const candidateMatch = await matchResumeWithJD_ATS_Reuse({
        resumeText: candidateResume,
        jobDescription,
        baselineData: baselineDataForReuse
      });

      const candidateScore = candidateMatch.finalScore;

      // Protected keyword penalty calculation
      const penaltyResult = calculateProtectedKeywordPenalty(protectedKeywords, candidateResume);
      const adjustedScore = Math.max(0, candidateScore - penaltyResult.penalty);

      // Diff analysis
      const diffReport = analyzeResumeDiff(resumeText, candidateResume, resumeJSON, parsedDiff);

      // Generate Candidate Critic Report
      const candidateCriticReport = criticizeResume({
        baselineMatch: candidateMatch,
        resumeText: candidateResume,
        jobDescription
      });

      // Quality evaluation
      const qualityScores = calculateQualityScore({
        candidateMatch,
        baselineMatch,
        candidateText: candidateResume,
        originalText: resumeText,
        criticReport,
        candidateCriticReport
      });

      const kwAdded = candidateMatch.matchedSkills.filter(s => !baselineMatch.matchedSkills.includes(s));
      const kwRemoved = baselineMatch.matchedSkills.filter(s => !candidateMatch.matchedSkills.includes(s));

      const sections = diffReport.sectionsModified;

      const evalResult = evaluateCandidate({
        baselineMatch,
        candidateMatch,
        adjustedScore,
        penaltyResult,
        verification
      });

      const attemptStatus = evalResult.accepted ? "accepted" : "rejected";

      console.log(`\n[QUALITY GATE] Attempt ${attempt}`);
      console.log(`  Verification: ${verification.valid ? "PASS" : "FAIL"}`);
      console.log(`  Candidate ATS: ${candidateScore}%`);
      console.log(`  Baseline ATS: ${baselineScore}%`);
      console.log(`  Skill Score: ${candidateMatch.skillScore}%`);
      console.log(`  Semantic Score: ${candidateMatch.semanticScore}%`);
      console.log(`  Keyword Delta: ${candidateMatch.matchedSkills.length - baselineMatch.matchedSkills.length > 0 ? "+" : ""}${candidateMatch.matchedSkills.length - baselineMatch.matchedSkills.length}`);
      console.log(`  Protected Keywords Lost: ${penaltyResult.missingKeywords.length}`);
      console.log(`  Decision: ${attemptStatus.toUpperCase()}`);
      if (!evalResult.accepted) {
        console.log(`  Reason: ${evalResult.reason}`);
      }

      const diagnostics = {
        attempt,
        score: candidateScore,
        adjustedScore,
        skillScore: candidateMatch.skillScore,
        semanticScore: candidateMatch.semanticScore,
        status: attemptStatus,
        keywordsAdded: kwAdded,
        keywordsRemoved: kwRemoved,
        protectedKeywordsMissing: penaltyResult.missingKeywords,
        sectionsModified: sections,
        integrityValid: verification.valid,
        verificationReasons: verification.reasons,
        reason: evalResult.reason
      };

      attemptLogs.push(diagnostics);

      if (evalResult.accepted) {
        acceptedResult = {
          tailoredResume: candidateResume,
          changesSummary: parsedDiff.changesSummary || [],
          reasoning: parsedDiff.reasoning || [],
          improvedScore: adjustedScore
        };
        lastDiffReport = diffReport;
        lastQualityScores = qualityScores;
        lastCandidateMatch = candidateMatch;
        break;
      }
    }

    // 5. Build final response
    const totalTime = Date.now() - startTime;
    const optimizationRejected = !acceptedResult;

    console.log(`\n======================================================`);
    console.log(`[QUALITY GATE] Resume Tailoring Run Complete`);
    console.log(`======================================================`);
    console.log(`Final Decision ........ ${optimizationRejected ? "REJECTED — Original Preserved" : "ACCEPTED"}\n`);

    const tableData = [
      { Attempt: "Baseline", ATS: `${baselineScore}%`, Adjusted: `${baselineScore}%`, Status: "—" },
      ...attemptLogs.map(log => ({
        Attempt: String(log.attempt),
        ATS: `${log.score}%`,
        Adjusted: `${log.adjustedScore}%`,
        Status: log.status.toUpperCase()
      }))
    ];
    console.table(tableData);
    console.log(`======================================================\n`);

    let recommendationReport = null;
    let acceptedDiagnostics = null;
    if (!optimizationRejected) {
      recommendationReport = generateRecommendationReport({
        baselineMatch,
        candidateMatch: lastCandidateMatch,
        diffReport: lastDiffReport,
        qualityScores: lastQualityScores
      });
      acceptedDiagnostics = attemptLogs[attemptLogs.length - 1];
    }

    const responsePayload = {
      success: true,
      status: optimizationRejected ? "REJECTED" : "ACCEPTED",
      baseline: {
        score: baselineScore,
        semanticScore: baselineMatch.semanticScore,
        skillScore: baselineMatch.skillScore,
        matchedSkills: baselineMatch.matchedSkills
      },
      acceptedCandidate: optimizationRejected ? null : acceptedResult.tailoredResume,
      acceptedDiagnostics: optimizationRejected ? null : acceptedDiagnostics,
      attemptLogs,
      changesSummary: optimizationRejected ? ["No meaningful ATS score gain is possible."] : acceptedResult.changesSummary,
      reasoning: optimizationRejected ? "All attempts rejected by State Machine." : acceptedResult.reasoning,
      improvedScore: optimizationRejected ? baselineScore : acceptedResult.improvedScore,
      recommendationReport,
      message: optimizationRejected ? "Optimization Rejected — Original Resume Preserved" : "Resume tailored successfully",
      optimizationRejected,
      tailoredResume: optimizationRejected ? resumeText : acceptedResult.tailoredResume,
      workspace
    };

    if (process.env.NODE_ENV !== "production") {
      responsePayload.debug = {
        cacheHit: "MISS",
        resumeParsed: resumeParsedOnTheFly ? "YES" : "NO",
        geminiTime: `${geminiTime}ms`,
        totalTime: `${totalTime}ms`
      };
    }

    if (!optimizationRejected && workspace) {
      console.log("[TAILOR STEP 8] Persisting workspace with optimized resume");
      
      workspace.resume = workspace.resume || {};
      
      // Update canonical schema
      if (workspace.resume.original) {
        workspace.resume.optimized = {
          version: (workspace.resume.original.version || 1) + 1,
          rawText: acceptedResult.tailoredResume,
          createdAt: new Date().toLocaleString()
        };
        workspace.resume.activeVersion = "optimized";
      } else {
        // Fallback for legacy schema
        workspace.resume.optimized = acceptedResult.tailoredResume;
      }
      
      await persistWorkspace(userId, workspace);
    }

    // Cache for future identical requests
    tailorResponseCache.set(requestHash, responsePayload);

    console.log("[TAILOR STEP 9] Success - Returning Response");
    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("Resume Tailor Fatal Error");
    console.error(error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: error.message || "Failed to tailor resume"
    });
  }
};