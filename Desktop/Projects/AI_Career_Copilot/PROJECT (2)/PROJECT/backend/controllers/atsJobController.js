import { GoogleGenerativeAI } from "@google/generative-ai";
import { matchResumeWithJD_ATS } from "../utils/atsEngine.js";
import { generateSuggestions, generateDetailedAnalysis } from "../utils/aiEngine.js";
import Analysis from "../models/Analysis.js";
import { inMemoryDB, saveInMemoryDB } from "../config/db.js";
import Profile from "../models/Profile.js";
import { getOrCreateWorkspace, persistWorkspace } from "../utils/workspaceUtils.js";

const getUserProfileContext = async (userId) => {
  if (!userId) return null;
  try {
    const profile = await Profile.findOne({ userId });
    if (profile) return profile;
  } catch (err) {
    // DB offline fallback
  }
  return inMemoryDB.profiles.find(p => p.userId === userId) || null;
};

let genAI = null;
const initGemini = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getDetectedTitle = (jdText) => {
  const lines = String(jdText || "").split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 80 && !firstLine.includes(".") && !firstLine.toLowerCase().startsWith("we are") && !firstLine.toLowerCase().startsWith("about")) {
      return firstLine;
    }
  }
  return null;
};

const getRoleFromDomain = (domain) => {
  const d = String(domain || "").toLowerCase().trim();
  const map = {
    "machine learning": "Machine Learning Engineer",
    "mechanical engineering": "Mechanical Engineer",
    "marketing": "Marketing Executive",
    "software engineering": "Software Engineer",
    "data science": "Data Scientist",
    "data analytics": "Data Analyst",
    "sales": "Sales Executive",
    "finance": "Financial Analyst",
    "hr": "HR Specialist",
    "cybersecurity": "Cybersecurity Engineer",
    "cloud computing": "Cloud Engineer",
    "product management": "Product Manager",
    "business analysis": "Business Analyst",
    "civil engineering": "Civil Engineer",
    "electrical engineering": "Electrical Engineer",
    "electronics engineering": "Electronics Engineer",
    "manufacturing engineering": "Manufacturing Engineer",
    "industrial engineering": "Industrial Engineer"
  };
  return map[d] || null;
};

const extractJobDetails = async (jobDescription, domain) => {
  let role = null;
  let company = "Not Specified";
  let detectedTitle = getDetectedTitle(jobDescription);

  try {
    const genai = initGemini();
    if (genai) {
      const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Extract the job title and company name. Return ONLY JSON: {"role":"...","company":"..."}.\nJob Description:\n${jobDescription.substring(0, 1000)}`;

      const result = await model.generateContent(prompt);
      const content = result.response.text();
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.role && parsed.role.toLowerCase() !== "software engineer" && parsed.role.toLowerCase() !== "not specified") {
        role = parsed.role;
      }
      if (parsed.company) {
        company = parsed.company;
      }
    }
  } catch (err) {
    console.warn("⚠️ Gemini job details extraction failed:", err?.message);
  }

  // Fallback Logic:
  if (!role) {
    if (detectedTitle) {
      role = detectedTitle;
    } else {
      role = getRoleFromDomain(domain) || "Not Specified";
    }
  }

  return { role, company };
};

export const matchJobController_ATS = async (req, res) => {
  const startTime = Date.now();
  console.log("[STEP 1] Match request received");
  try {
    const { resumeText, resumeSkills = [], jobDescription } = req.body;

    const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

    if (!resumeText || !isNonEmptyString(resumeText)) {
      return res.status(400).json({ error: "resumeText is missing" });
    }
    if (!jobDescription || !isNonEmptyString(jobDescription)) {
      return res.status(400).json({ error: "jobDescription is missing" });
    }

    if (!Array.isArray(resumeSkills) || resumeSkills.length === 0) {
      return res.status(400).json({ error: "resumeSkills must be a non-empty array" });
    }

    // 1. Run ATS Match Engine
    const atsStart = Date.now();
    const match = await matchResumeWithJD_ATS({ resumeText, resumeSkills, jobDescription });
    const atsTime = Date.now() - atsStart;

    console.log({
        stage: "1. ATS Engine -> atsJobController",
        matchedSkills: match.matchedSkills?.length,
        missingSkills: match.missingSkills?.length,
        strengths: match.strengths?.length,
        weaknesses: match.weaknesses?.length,
        atsScore: match.finalScore,
        keys: Object.keys(match)
    });

    // 2. Extract basic job details
    const extractStart = Date.now();
    const localRole = getDetectedTitle(jobDescription) || getRoleFromDomain(match.debug?.domainDetection?.domainJD?.domain) || "Software Engineer";
    const jobDetails = await extractJobDetails(jobDescription, match.debug?.domainDetection?.domainJD?.domain);
    const extractTime = Date.now() - extractStart;

    // 3. Save initial Analysis shell to DB/inMemoryDB
    const dbStart = Date.now();
    const userId = req.userId || req.user?.id;
    let savedAnalysis = null;
    try {
      savedAnalysis = await Analysis.create({
        userId: userId,
        resumeSkills,
        jobDescription,
        role: jobDetails.role,
        company: jobDetails.company,
        matchScore: match.finalScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        suggestions: [],
        interviewQuestions: { technical: [], behavioral: [] }
      });
    } catch (dbError) {
      console.warn("⚠️ Could not save to DB (MongoDB unavailable), saving to in-memory storage");
      savedAnalysis = {
        _id: Date.now().toString(),
        userId: userId,
        role: jobDetails.role,
        company: jobDetails.company,
        matchScore: match.finalScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        createdAt: new Date().toISOString()
      };
      inMemoryDB.analyses.unshift(savedAnalysis);
      saveInMemoryDB();
    }
    const dbTime = Date.now() - dbStart;
    const totalTime = Date.now() - startTime;

    // Detailed Timing Log summary
    console.log(`\n======================================================`);
    console.log(`[JOB ANALYSIS] Initial ATS Match Phase Completed`);
    console.log(`======================================================`);
    console.log(`ATS Engine Score Match . ${atsTime}ms`);
    console.log(`JD Title & Details ..... ${extractTime}ms`);
    console.log(`Database Shell Write ... ${dbTime}ms`);
    console.log(`TOTAL Latency .......... ${totalTime}ms`);
    console.log(`======================================================\n`);

    const diagnostics = {
      timing: {
        atsEngine: `${atsTime}ms`,
        jdExtraction: `${extractTime}ms`,
        databaseWrite: `${dbTime}ms`,
        total: `${totalTime}ms`
      }
    };

    const matchResult = {
      matchScore: match.finalScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      resumeSkills: match.resumeSkills,
      jdSkills: match.jdSkills,
      semanticScore: match.semanticScore,
      skillScore: match.skillScore,
      experienceScore: match.experienceScore,
      educationScore: match.educationScore,
      certificationScore: match.certificationScore,
      domainMatch: match.domainMatch,
      strengths: match.strengths,
      weaknesses: match.weaknesses,
      improvementSuggestions: match.improvementSuggestions,
      domainResume: match.domainResume,
      domainJD: match.domainJD,
      isDomainMismatch: match.isDomainMismatch,
      primaryReason: match.primaryReason,
      aiRecommendation: match.aiRecommendation,
      debug: match.debug
    };

    console.log({
        stage: "2. API Response",
        matchedSkills: matchResult.matchedSkills?.length,
        missingSkills: matchResult.missingSkills?.length,
        strengths: matchResult.strengths?.length,
        weaknesses: matchResult.weaknesses?.length,
        atsScore: matchResult.matchScore,
        keys: Object.keys(matchResult)
    });

    // Transactional Workspace Update
    const workspace = await getOrCreateWorkspace(userId);
    workspace.analyses = workspace.analyses || { history: [], latestAnalysis: null, jobDesc: "" };
    workspace.analyses.latestAnalysis = { match: matchResult, analysis: savedAnalysis, diagnostics };
    workspace.analyses.jobDesc = jobDescription;
    if (!workspace.analyses.history) workspace.analyses.history = [];
    workspace.analyses.history.unshift(savedAnalysis);
    await persistWorkspace(userId, workspace);

    return res.status(200).json({
      match: matchResult,
      analysis: savedAnalysis,
      diagnostics
    });
  } catch (err) {
    console.error("[ATS FATAL ERROR]", err);
    return res.status(500).json({ error: err?.message });
  }
};

export const matchJobDetailedController_ATS = async (req, res) => {
  const startTime = Date.now();
  try {
    const { resumeText, jobDescription, matchedSkills, missingSkills, targetRole, isDomainMismatch, primaryReason } = req.body;

    const detailedAnalysis = await generateDetailedAnalysis({
      resumeText,
      jobDescription,
      matchedSkills,
      missingSkills,
      targetRole,
      isDomainMismatch,
      primaryReason
    });

    const elapsed = Date.now() - startTime;
    console.log(`[TIMING] Detailed analysis generated in ${elapsed}ms`);

    return res.status(200).json({
      success: true,
      detailedAnalysis,
      timing: `${elapsed}ms`
    });
  } catch (err) {
    console.error("Detailed analysis controller error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const matchJobSuggestionsController_ATS = async (req, res) => {
  const startTime = Date.now();
  try {
    const { analysisId, matchedSkills, missingSkills, targetRole, resumeSkills, resumeText } = req.body;
    const userId = req.userId || req.user?.id;
    const profile = await getUserProfileContext(userId);

    const aiResult = await generateSuggestions({
      matchedSkills,
      missingSkills
    }, targetRole, resumeSkills, profile, resumeText);

    // Save to Database
    try {
      const technicalQuestions = aiResult.questions?.technical || [];
      const behavioralQuestions = aiResult.questions?.behavioral || [];
      
      const updateData = {
        suggestions: aiResult.suggestions || [],
        interviewQuestions: {
          technical: technicalQuestions,
          behavioral: behavioralQuestions
        }
      };

      if (analysisId) {
        await Analysis.findByIdAndUpdate(analysisId, updateData);
      }
    } catch (dbErr) {
      const idx = inMemoryDB.analyses.findIndex(a => a._id === analysisId);
      if (idx >= 0) {
        inMemoryDB.analyses[idx].suggestions = aiResult.suggestions || [];
        inMemoryDB.analyses[idx].interviewQuestions = {
          technical: aiResult.questions?.technical || [],
          behavioral: aiResult.questions?.behavioral || []
        };
        saveInMemoryDB();
      }
    }

    // Transactional Workspace Update
    const workspace = await getOrCreateWorkspace(userId);
    if (workspace.analyses && workspace.analyses.latestAnalysis) {
      workspace.analyses.latestAnalysis.ai = {
        suggestions: aiResult.suggestions || [],
        questions: {
          technical: aiResult.questions?.technical || [],
          behavioral: aiResult.questions?.behavioral || []
        }
      };
      await persistWorkspace(userId, workspace);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[TIMING] Suggestions & questions generated in ${elapsed}ms`);

    console.log({
        stage: "1. AI Generated",
        exists: !!aiResult.suggestions,
        isArray: Array.isArray(aiResult.suggestions),
        length: aiResult.suggestions?.length,
        keys: aiResult.suggestions?.[0] ? Object.keys(aiResult.suggestions[0]) : []
    });

    const responsePayload = {
      success: true,
      suggestions: aiResult.suggestions || [],
      questions: aiResult.questions || { technical: [], behavioral: [] },
      timing: `${elapsed}ms`
    };

    console.log({
        stage: "2. Controller Response",
        exists: !!responsePayload.suggestions,
        isArray: Array.isArray(responsePayload.suggestions),
        length: responsePayload.suggestions?.length,
        keys: responsePayload.suggestions?.[0] ? Object.keys(responsePayload.suggestions[0]) : [],
        responseKeys: Object.keys(responsePayload)
    });

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("Suggestions controller Fatal Error");
    console.error(err);
    console.error(err.stack);
    return res.status(500).json({ error: err.message });
  }
};
