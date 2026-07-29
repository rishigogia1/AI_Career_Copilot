import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { generateContentWithAI } from "../utils/geminiClient.js";

const testTailor = async () => {
  const resumeText = "John Doe\nSoftware Engineer\nSkills: React, Node.js";
  const jobDescription = "Frontend Developer\nSkills required: React, TypeScript, Node.js";
  const missingSkills = ["TypeScript"];
  const missingKeywords = ["TypeScript"];

  const prompt = `You are a professional Executive Resume Writer and ATS Optimization Expert.
Your task is to tailor the candidate's resume for the target job description to maximize its ATS score while maintaining strict factual integrity.

CRITICAL RULES:
1. PRESERVE FACTUAL ACCURACY: Do NOT invent, hallucinate, or exaggerate any details such as company names, dates, project names, college names, certifications, internships, or years of experience.
2. ENHANCE AND REWRITE: You may rewrite summaries, project descriptions, and experience bullets to use strong action verbs, professional grammar, and align their achievements with the job description keywords.
3. INTEGRATE KEYWORDS: Naturally weave in the missing skills and keywords provided below into existing descriptions or the skills list only if it makes logical, truthful sense based on their background.

CONTEXT:
Original Resume Text:
${resumeText}

Target Job Description:
${jobDescription}

Missing Skills to Target:
${missingSkills.join(", ")}

Missing Keywords to Target:
${missingKeywords.join(", ")}

Return ONLY a valid JSON object matching this exact schema:
{
  "tailoredResume": "The complete rewritten resume text in a professional, clean, ATS-optimized plain-text layout.",
  "changesSummary": ["Specific modifications made (e.g. 'Rewrote XYZ project bullet to emphasize React and Docker', 'Reorganized skills section')"],
  "reasoning": "A brief explanation of the optimization strategy."
}
`;

  console.log("Calling generateContentWithAI...");
  try {
    const content = await generateContentWithAI(prompt, "gemini-2.5-flash");
    console.log("SUCCESS: Raw Content received:");
    console.log(content);
  } catch (error) {
    console.error("FAILURE: Error received:");
    console.error(error);
  }
};

testTailor();
