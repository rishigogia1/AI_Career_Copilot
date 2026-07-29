import { generateContentWithAI } from "../utils/geminiClient.js";
import { matchResumeWithJD } from "../utils/matchEngine.js";
import { matchResumeWithJD_ATS } from "../utils/atsEngine.js";
import Profile from "../models/Profile.js";
import { inMemoryDB } from "../config/db.js";
import crypto from "crypto";
import { getSkillCategory, getFallbackRoadmap } from "../utils/fallbackRoadmaps.js";

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

// ─────────────────────────────────────────
// 🔁 REWRITE BULLET POINTS
// ─────────────────────────────────────────
export const rewriteBulletsController = async (req, res) => {
  try {
    const { bullets, targetRole } = req.body;
    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) {
      return res.status(400).json({ message: "Please provide at least one bullet point" });
    }
    const profile = await getUserProfileContext(req.userId);
    const role = targetRole || profile?.targetRole || profile?.careerGoal || "Software Engineer";

    const bulletsText = bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");

    try {
      const prompt = `You are an expert resume writer. Transform weak bullet points into strong, ATS-optimized ones.
Rules: Start with action verbs (Led, Built, Reduced, Increased), add metrics, keep concise.
Return ONLY a JSON array of rewritten strings, no explanation.

Target Role: ${role}
Original bullets:
${bulletsText}
Return ONLY a JSON array with ${bullets.length} improved bullets.`;

      const content = await generateContentWithAI(prompt, "gemini-2.5-flash");
      const cleaned = content.replace(/```json|```/g, "").trim();
      const rewritten = JSON.parse(cleaned);

      return res.json({ message: "Bullets rewritten successfully", original: bullets, rewritten });

    } catch (aiError) {
      // Fallback: rule-based rewrites when Gemini is unavailable
      const actionVerbs = ["Developed", "Built", "Implemented", "Designed", "Led", "Optimized", "Delivered", "Created"];
      const rewritten = bullets.map((bullet, i) => {
        const verb = actionVerbs[i % actionVerbs.length];
        const clean = bullet.replace(/^(worked on|helped with|assisted in|was responsible for)\s*/i, "");
        const improved = clean.charAt(0).toLowerCase() + clean.slice(1);
        return `${verb} ${improved}, resulting in measurable improvements to team productivity and project delivery`;
      });

      return res.json({
        message: "Gemini unavailable — showing rule-based rewrites",
        original: bullets,
        rewritten,
        fallback: true
      });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 📊 DETAILED ATS SCORE
// ─────────────────────────────────────────
export const atsScoreController = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ message: "resumeText and jobDescription are required" });
    }

    const atsResult = await matchResumeWithJD_ATS({
      resumeText,
      resumeSkills: [],
      jobDescription
    });

    const overallScore = atsResult.finalScore;
    const keywordScore = atsResult.semanticScore;
    const skillScore = atsResult.skillScore;
    const experienceScore = atsResult.experienceScore;
    const educationScore = atsResult.educationScore;
    const finalScore = atsResult.finalScore;

    let verdict = "Weak Match";
    if (overallScore >= 80) {
      verdict = "Strong Match";
    } else if (overallScore >= 60) {
      verdict = "Good Match";
    } else if (overallScore >= 40) {
      verdict = "Moderate Match";
    }

    const atsReport = {
      overallScore,
      sections: {
        keywordMatch: {
          score: keywordScore,
          matched: atsResult.matchedSkills,
          missing: atsResult.missingSkills
        },
        skillsMatch: {
          score: skillScore,
          matched: atsResult.matchedSkills,
          missing: atsResult.missingSkills
        },
        experienceMatch: {
          score: experienceScore,
          feedback: atsResult.strengths.join(". ") || "Experience matches requirements."
        },
        educationMatch: {
          score: educationScore,
          feedback: atsResult.weaknesses.join(". ") || "Education matches requirements."
        }
      },
      quickWins: atsResult.improvementSuggestions,
      verdict
    };

    console.log("[ATS ENGINE RESULT]", atsResult);
    console.log("[ATS REPORT GENERATED]", atsReport);
    console.log("[ATS KEYWORD SCORE]", keywordScore);
    console.log("[ATS SKILL SCORE]", skillScore);
    console.log("[ATS EXPERIENCE SCORE]", experienceScore);
    console.log("[ATS EDUCATION SCORE]", educationScore);
    console.log("[ATS FINAL SCORE]", finalScore);

    return res.json({ message: "ATS analysis complete", atsReport });

  } catch (error) {
    console.error("[ATS SCORE ANALYZER ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};

// 🗺️ AI GAP ROADMAP
// ─────────────────────────────────────────
export const gapRoadmapController = async (req, res) => {
  try {
    const { skill, targetRole } = req.body;
    if (!skill) {
      return res.status(400).json({ message: "Skill is required" });
    }
    const profile = await getUserProfileContext(req.userId);
    const role = targetRole || profile?.targetRole || profile?.careerGoal || "Software Engineer";
    const category = getSkillCategory(skill);
    const profileContext = profile ? `Candidate Context: Target Career Goal = ${profile.careerGoal || role}, College = ${profile.college || 'N/A'}, Graduation Year = ${profile.graduationYear || 'N/A'}. Tailor the roadmap concepts, difficulty, resources, and interview questions to align with this candidate background.` : "";

    // Inject a unique salt to guarantee variations in examples/exercises/resources
    const salt = crypto.randomBytes(4).toString("hex");

    try {
      const prompt = `You are a Senior Technical Instructor at Google Career Certificates. Design a structured, high-quality 7-day progressive study curriculum (bootcamp style) to close the skill gap for "${skill}" to qualify for a "${role}" position. ${profileContext}
(Random Salt for unique exercises/resources: ${salt})
Skill Domain Category: ${category}

CRITICAL RULES FOR PROGRESSION AND NO-REPETITION:
1. Generate the ENTIRE 7-day roadmap in ONE single response. Each day must build progressively on the previous day.
2. Every day MUST teach completely new concepts. Do NOT repeat topics, paragraphs, exercises, quizzes, or interview questions across days.
3. If the skill is a soft skill (like "Communication Skills" or "Leadership"), do NOT use software engineering terms (like 'syntax', 'compilation', 'database', 'sandbox') unless they are actually relevant.
4. The content blocks must vary by day to keep the layout engaging:
   - Day 1: Focus on Learning Objectives & Core Theory
   - Day 2: Focus on Hands-on Lab & Practical Syntax/Methodology
   - Day 3: Focus on Industry Use Cases & Common Gotchas
   - Day 4: Focus on Mini Project & Refactoring/Upgrades
   - Day 5: Focus on Quiz & Performance Tuning/Efficiency
   - Day 6: Focus on Portfolio Tasks & Resume Tips
   - Day 7: Culminates in a Final Capstone Portfolio-ready Project, Mock Interview, and Resume-ready Achievement.
5. Provide a realistic estimated study time (e.g. "2 hours", "3.5 hours") and difficulty level (Beginner/Intermediate/Advanced) for each day that increases naturally.

Your response must be a single, valid JSON object following this schema exactly:
{
  "skill": "${skill}",
  "overview": "Detailed conceptual description and why it matters for ${role}...",
  "domain": "${category}",
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
  "days": [
    {
      "day": 1,
      "title": "Day Title...",
      "contentType": "Theory/Hands-on Lab/Mini Project/etc.",
      "estimatedTime": "e.g., 2 hours",
      "difficulty": "Beginner/Intermediate/Advanced",
      "learningObjectives": ["Objective A", "Objective B"],
      "theory": "Core theoretical concept explanation (completely unique to this day)...",
      "details": "What to study and key syntax/tools/methods (completely unique to this day)...",
      "practice": "Practical hands-on exercise (completely unique to this day)...",
      "resource": { "title": "Resource Name", "link": "https://example.com/resource" },
      "interviewQuestion": {
        "question": "A mock technical/behavioral question for today",
        "answer": "Guidance on how to answer..."
      },
      "resumeTip": "Resume-ready bullet point showcasing this day's outcome",
      "portfolioTask": "Specific action/task to upload to GitHub or add to portfolio",
      "quiz": [
        {
          "question": "A single-choice quiz question based on this day's concepts",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctOption": "Option A"
        }
      ]
    }
  ],
  "project": {
    "title": "Capstone Project Title",
    "description": "Comprehensive portfolio project details...",
    "features": ["Feature 1", "Feature 2"]
  }
}

Return ONLY this JSON object. Do not include markdown wraps or explanation outside the JSON.`;

      const content = await generateContentWithAI(prompt, "gemini-2.5-flash");
      
      console.log("------------------ RAW GEMINI RESPONSE START ------------------");
      console.log(content);
      console.log("------------------ RAW GEMINI RESPONSE END --------------------");

      const cleaned = content.replace(/```json|```/g, "").trim();
      let roadmap;
      try {
        roadmap = JSON.parse(cleaned);
      } catch (parseError) {
        console.error("❌ [GEMINI JSON PARSE ERROR] Failed to parse Gemini response as JSON:", parseError);
        console.error("Cleaned Content that failed parsing:", cleaned);
        throw parseError; // Force fallback execution
      }

      return res.json({ message: "Roadmap generated successfully", roadmap });

    } catch (aiError) {
      console.warn("⚠️ Gemini roadmap generation failed or parsing errored. Running custom fallback category:", category);
      console.warn("Error message:", aiError.message);
      
      const fallback = getFallbackRoadmap(skill, category, role);
      return res.json({ message: "Roadmap generated successfully (fallback mode)", roadmap: fallback });
    }
  } catch (error) {
    console.error("[GAP ROADMAP ERROR]", error);
    res.status(500).json({ message: error.message });
  }
};
