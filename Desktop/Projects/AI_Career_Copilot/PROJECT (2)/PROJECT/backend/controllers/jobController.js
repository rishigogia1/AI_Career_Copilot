import { generateContentWithAI } from "../utils/geminiClient.js";
import { matchResumeWithJD } from "../utils/matchEngine.js";
import { generateSuggestions } from "../utils/aiEngine.js";
import Analysis from "../models/Analysis.js";

import { inMemoryDB, saveInMemoryDB } from "../config/db.js";
import Profile from "../models/Profile.js";

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

// 🔹 Extract job title and company from JD using Gemini
const extractJobDetails = async (jobDescription) => {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️ AI API keys not configured, using defaults");
      return {
        role: "Software Engineer",
        company: "Not Specified"
      };
    }

    const prompt = `Extract the job title and company name from this job description.
                    If company name is not mentioned, return "Not Specified".
                    If job title is not mentioned, return "Software Engineer".
                    
                    Return ONLY a JSON object, no explanation, no markdown.
                    Example: {"role": "Frontend Developer", "company": "Google"}
                    
                    Job Description:
                    ${jobDescription.substring(0, 1000)}`;

    const content = await generateContentWithAI(prompt, "gemini-2.5-flash");
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      role: parsed.role || "Software Engineer",
      company: parsed.company || "Not Specified"
    };
  } catch (error) {
    console.warn("⚠️ Gemini extraction failed:", error.message);
    return {
      role: "Software Engineer",
      company: "Not Specified"
    };
  }
};

// 🔹 Match Resume with Job + AI Suggestions + Save
export const matchJobController = async (req, res) => {
  console.log("[CONTROLLER USED] jobController");
  try {
    console.log("[LEGACY REQUEST BODY]", req.body);
    const { resumeSkills, jobDescription } = req.body;

    const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

    // Detailed validation errors
    if (!resumeSkills) {
      return res.status(400).json({ error: "resumeSkills is missing" });
    }
    if (!Array.isArray(resumeSkills)) {
      return res.status(400).json({ error: "resumeSkills must be an array" });
    }
    if (resumeSkills.length === 0) {
      return res.status(400).json({ error: "resumeSkills must be a non-empty array" });
    }
    if (!jobDescription || !isNonEmptyString(jobDescription)) {
      return res.status(400).json({ error: "jobDescription is missing" });
    }


    console.log("🔍 Starting job analysis...");

    // 🔹 Matching Logic
    const matchResult = matchResumeWithJD(resumeSkills, jobDescription);
    console.log("✅ Match result:", matchResult);

    // 🔹 Extract job title + company from JD
    const jobDetails = await extractJobDetails(jobDescription);
    console.log("✅ Job details extracted:", jobDetails);

    const userId = req.userId || req.user?.id;
    const profile = await getUserProfileContext(userId);

    // 🔹 AI Suggestions (with resume context for personalization)
    const resumeText = req.body.resumeText || "";
    const aiResult = await generateSuggestions(matchResult, jobDetails.role, resumeSkills, profile, resumeText);
    console.log("✅ AI suggestions generated");

    // ✅ Correct fields from aiEngine
    const technical = aiResult.questions?.technical || [];
    const behavioral = aiResult.questions?.behavioral || [];

    // 🔥 SAVE TO DB (with role + company)
    let savedAnalysis = null;
    try {
      savedAnalysis = await Analysis.create({
        userId: userId,
        resumeSkills,
        jobDescription,
        role: jobDetails.role,
        company: jobDetails.company,
        matchScore: matchResult.matchScore,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        suggestions: aiResult.suggestions || [],
        interviewQuestions: {
          technical,
          behavioral
        }
      });
      console.log("✅ Analysis saved to DB");
    } catch (dbError) {
      console.warn("⚠️ Could not save to DB (MongoDB unavailable), saving to in-memory storage");
      // Save to in-memory fallback
      savedAnalysis = {
        _id: Date.now().toString(),
        userId: userId,
        role: jobDetails.role,
        company: jobDetails.company,
        matchScore: matchResult.matchScore,
        matchedSkills: matchResult.matchedSkills,
        missingSkills: matchResult.missingSkills,
        createdAt: new Date().toISOString()
      };
      inMemoryDB.analyses.unshift(savedAnalysis); // Add to front of array
      saveInMemoryDB();
      console.log("✅ Analysis saved to in-memory storage. Total analyses:", inMemoryDB.analyses.length);
    }

    const technicalQuestions = technical;
    const behavioralQuestions = behavioral;

    console.log("========== TECHNICAL QUESTIONS ==========");
    technicalQuestions.forEach((q,i)=>{
      console.log(i, q.question);
      console.log(i, q.answer);
    });

    console.log("========== BEHAVIORAL QUESTIONS ==========");
    behavioralQuestions.forEach((q,i)=>{
      console.log(i, q.question);
      console.log(i, q.answer);
    });

    // API RESPONSE VALIDATION
    const techAnswers = technicalQuestions.map(x => typeof x.answer === 'object' ? JSON.stringify(x.answer) : x.answer);
    const behAnswers = behavioralQuestions.map(x => typeof x.answer === 'object' ? JSON.stringify(x.answer) : x.answer);
    if (
      techAnswers.some((val, idx, arr) => arr.indexOf(val) !== idx) ||
      behAnswers.some((val, idx, arr) => arr.indexOf(val) !== idx)
    ) {
      console.error("DUPLICATE ANSWERS FOUND IN BACKEND");
    }

    // 🔥 RESPONSE
    res.status(200).json({
      message: "Match analysis complete",
      match: matchResult,
      ai: {
        suggestions: aiResult.suggestions || [],
        questions: {
          technical,
          behavioral
        }
      },
      saved: savedAnalysis || { role: jobDetails.role, company: jobDetails.company }
    });

  } catch (error) {
    console.error("❌ Job analysis error:", error.message);
    res.status(500).json({
      message: "Analysis failed: " + error.message
    });
  }
};

// 🔹 Get All Analysis History
export const getAnalysisHistory = async (req, res) => {
  try {
    let history = [];
    
    try {
      // If we have a user from authMiddleware, filter by them
      const query = req.user?.id ? { userId: req.user.id } : {};
      
      history = await Analysis.find(query)
        .sort({ createdAt: -1 })
        .lean();
    } catch (dbError) {
      console.warn("⚠️ Could not fetch from DB (MongoDB unavailable), using in-memory storage");
      // Fallback: Use in-memory data if DB is down, filtering by user ID
      history = inMemoryDB.analyses.filter(item => !req.user?.id || item.userId === req.user.id);
    }

    // 🔹 Include role + company in response
    const formatted = history.map(item => ({
      id: item._id,
      role: item.role || "Software Engineer",
      company: item.company || "Not Specified",
      matchScore: item.matchScore || 0,
      matchedSkills: item.matchedSkills || [],
      missingSkills: item.missingSkills || [],
      createdAt: item.createdAt || new Date().toISOString()
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      count: formatted.length,
    });

  } catch (error) {
    console.error("❌ History fetch error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch history"
    });
  }
};