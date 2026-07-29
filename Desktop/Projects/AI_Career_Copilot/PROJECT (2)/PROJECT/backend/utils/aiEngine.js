import { generateContentWithAI } from "./geminiClient.js";
import crypto from "crypto";
import { LLMResponseParser } from './llmResponseParser.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = (promise, ms, fallbackValue) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("AI Request Timeout")), ms))
  ]).catch(err => {
    console.warn(`⚠️ AI generation timed out or failed after ${ms}ms:`, err.message);
    return fallbackValue;
  });
};

const callAIWithRetry = async (prompt, modelName = "gemini-2.5-flash", retries = 3, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await generateContentWithAI(prompt, modelName);
    } catch (error) {
      const isRateLimit = error.message?.includes("429") || error.status === 429;
      if (isRateLimit && i < retries - 1) {
        let waitTime = delay * Math.pow(2, i);
        const match = error.message?.match(/Please retry in (\d+(\.\d+)?)/i);
        if (match) {
          const seconds = parseFloat(match[1]);
          waitTime = Math.ceil(seconds * 1000) + 1500;
        }
        console.warn(`⚠️ AI API rate limited (429). Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
};

const extractAndParseJSON = (text) => {
  return LLMResponseParser.parse(text);
};

const normalizeKeys = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const normalized = {};
  const map = {
    whyasked: "whyAsked",
    whyisthisasked: "whyAsked",
    why_asked: "whyAsked",
    competency: "competency",
    interviewer_expectations: "interviewerExpectations",
    interviewerexpectations: "interviewerExpectations",
    expectations: "interviewerExpectations",
    answer_framework: "answerFramework",
    answerframework: "answerFramework",
    framework: "answerFramework",
    key_talking_points: "keyTalkingPoints",
    keytalkingpoints: "keyTalkingPoints",
    talkingpoints: "keyTalkingPoints",
    sample_answer: "sampleAnswer",
    sampleanswer: "sampleAnswer",
    answer: "sampleAnswer",
    common_mistakes: "commonMistakes",
    commonmistakes: "commonMistakes",
    mistakes: "commonMistakes",
    follow_up_questions: "followUpQuestions",
    followupquestions: "followUpQuestions",
    followups: "followUpQuestions",
    followup: "followUpQuestions",
    evaluation_rubric: "evaluationRubric",
    evaluationrubric: "evaluationRubric",
    rubric: "evaluationRubric",
    red_flags: "redFlags",
    redflags: "redFlags",
    keywords: "keywords",
    confidence_tips: "confidenceTips",
    confidencetips: "confidenceTips",
    tips: "confidenceTips"
  };

  for (const [key, val] of Object.entries(obj)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z]/g, "");
    if (map[cleanKey]) {
      normalized[map[cleanKey]] = val;
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
};

const getFieldFallback = (field, question, type) => {
  const fallbacks = {
    whyAsked: "This question evaluates your core competency, technical decision-making, and practical approach to solving problems in this role.",
    competency: type === "behavioral" ? "Behavioral & Communication" : "Technical Proficiency",
    interviewerExpectations: [
      "Clear, structured response demonstrating hands-on experience",
      "Understanding of tradeoffs and key concepts",
      "Examples showcasing real impact or outcomes"
    ],
    sampleAnswer: "To answer this question, structure your response around your relevant project experience, highlighting the technologies used, key actions taken, and the results achieved.",
    commonMistakes: [
      "Giving a generic textbook answer without project context",
      "Failing to mention tradeoffs or measurable results"
    ],
    followUpQuestions: [
      "Can you elaborate on how you handled limitations in this scenario?",
      "What would you do differently if you started over?"
    ],
    evaluationRubric: [
      { level: "Excellent", criteria: "Demonstrates deep expertise with specific, measurable examples" },
      { level: "Good", criteria: "Shows solid understanding with relevant project experience" },
      { level: "Average", criteria: "Provides correct but surface-level explanation" },
      { level: "Poor", criteria: "Cannot explain the concept or gives incorrect information" }
    ],
    redFlags: [
      "Lack of concrete examples",
      "Inability to explain fundamental concepts"
    ],
    keywords: [],
    confidenceTips: [
      "Structure your response clearly before speaking",
      "Connect your answers to real business outcomes"
    ]
  };
  return fallbacks[field] || "";
};

// ─────────────────────────────────────────
// Minimal Fallback (AI Unavailable)
// ─────────────────────────────────────────
const getMinimalFallback = (question, type) => {
  return {
    question,
    source: "fallback",
    category: type === "behavioral" ? "Behavioral" : "Technical",
    difficulty: "—",
    estimatedAnswerTime: "—",
    whyAsked: "AI generation is currently unavailable. This question tests core competencies relevant to the target role.",
    competency: type === "behavioral" ? "Professional behavior & communication" : "Technical problem-solving",
    interviewerExpectations: [
      "Clear, structured response demonstrating understanding",
      "Specific examples from real experience",
      "Awareness of best practices and tradeoffs"
    ],
    answerFramework: type === "behavioral" ? "STAR Method" : "Define → Explain → Example → Tradeoffs",
    keyTalkingPoints: [
      "Define the core concept clearly",
      "Share a specific project example",
      "Discuss tradeoffs and edge cases"
    ],
    sampleAnswer: "AI-generated sample answer is currently unavailable. Prepare a structured response using your own project experience, mentioning specific technologies and measurable outcomes.",
    commonMistakes: [
      "Giving a vague, textbook definition without practical context",
      "Failing to mention specific technologies or project work",
      "Not discussing tradeoffs or limitations"
    ],
    followUpQuestions: [
      "Can you elaborate on the technical decisions you made?",
      "What would you do differently if you started over?"
    ],
    evaluationRubric: [
      { level: "Excellent", criteria: "Demonstrates deep expertise with specific, measurable examples" },
      { level: "Good", criteria: "Shows solid understanding with relevant project experience" },
      { level: "Average", criteria: "Provides correct but surface-level explanation" },
      { level: "Poor", criteria: "Cannot explain the concept or gives incorrect information" }
    ],
    redFlags: [
      "Cannot provide any concrete example",
      "Contradicts fundamental principles"
    ],
    keywords: [],
    confidenceTips: [
      "Take a moment to structure your thoughts before answering",
      "Use the recommended framework to organize your response"
    ]
  };
};

// ─────────────────────────────────────────
// Core: Generate Answer for a Single Question
// ─────────────────────────────────────────
export const generateAnswerForQuestion = async (question, type, targetRole = "Software Engineer", candidateSkills = [], strictModePrompt = "", profile = null, resumeText = "") => {
  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.warn("⚠️ AI API keys not configured — returning minimal fallback");
    return getMinimalFallback(question, type);
  }

  let profileContext = "";
  if (profile) {
    const parts = [];
    if (profile.careerGoal || profile.targetRole) parts.push(`Target Role: ${profile.targetRole || profile.careerGoal}`);
    if (profile.college) parts.push(`Education: ${profile.college}`);
    if (profile.graduationYear) parts.push(`Graduation Year: ${profile.graduationYear}`);
    if (parts.length > 0) {
      profileContext = `\n\nCandidate Profile:\n${parts.join("\n")}`;
    }
  }

  const skillsText = Array.isArray(candidateSkills) ? candidateSkills.join(", ") : String(candidateSkills);

  let resumeContext = "";
  if (resumeText && resumeText.trim().length > 50) {
    const truncated = resumeText.substring(0, 1500);
    resumeContext = `\n\nCandidate Resume Summary (use this to personalize examples and sample answers):\n${truncated}`;
  }

  const salt = crypto.randomBytes(6).toString("hex");

  const prompt = `You are a Senior Software Engineer and Interview Panel Member who has personally conducted 500+ technical and behavioral interviews at Google, Microsoft, Amazon, Atlassian, and OpenAI.

Your task: Generate a completely unique, expert-level interview preparation guide for ONLY this one question. Write as an experienced interviewer who deeply understands what separates exceptional candidates from average ones.

CRITICAL RULES:
• Every section must be written from scratch for THIS specific question. Do NOT reuse generic phrases.
• Never use placeholder language like "Assessing hands-on proficiency when working with..."
• Never repeat sentence structures across sections.
• The sample answer must sound like a real human speaking in an interview — conversational, specific, with real technologies and measurable outcomes.
• Tailor everything to the candidate's target role: ${targetRole}
• If candidate skills are provided, reference them naturally in the sample answer.
• Determine the best answer framework dynamically based on the question type (do NOT default to STAR for everything).
${strictModePrompt}

(Generation ID: ${salt})

Interview Question:
"${question}"

Question Type: ${type === "behavioral" ? "Behavioral" : "Technical"}

Target Role: ${targetRole}
Candidate Skills: ${skillsText || "Not specified"}${profileContext}${resumeContext}

ANSWER FRAMEWORK SELECTION GUIDE (pick the most appropriate one):
- Behavioral/Teamwork/Conflict → STAR (Situation-Task-Action-Result)
- Technical Concept/Theory → Define → Deep Dive → Real-World Application → Edge Cases
- System Design → Requirements → Architecture → Tradeoffs → Scaling
- Debugging/Problem Solving → Root Cause → Investigation → Fix → Prevention
- Leadership/Management → Situation → Leadership Decision → Execution → Impact
- Learning/Adaptability → Current Knowledge → Learning Strategy → Practice → Measurable Outcome

Return ONLY valid JSON matching this exact schema (no markdown wrapping, no explanation):
{
  "question": "${question.replace(/"/g, '\\"')}",
  "category": "Technical | Behavioral | System Design | Leadership",
  "difficulty": "Beginner | Intermediate | Advanced",
  "estimatedAnswerTime": "e.g. 90 seconds or 2 minutes",
  "whyAsked": "A specific 2-3 sentence explanation of exactly why an interviewer asks this particular question and what signal they are looking for.",
  "competency": "The single core competency being evaluated",
  "interviewerExpectations": ["4-5 expectations the interviewer has for this question"],
  "answerFramework": "The specific framework name you chose from the guide above",
  "keyTalkingPoints": ["4-6 specific technical or behavioral points the candidate MUST mention"],
  "sampleAnswer": "A 150-250 word realistic, conversational interview answer. Must mention specific technologies relevant to ${targetRole}. Must include a concrete project scenario with measurable outcomes.",
  "commonMistakes": ["3-5 mistakes unique to this question"],
  "followUpQuestions": ["3-5 realistic follow-up questions an interviewer would ask after hearing the answer"],
  "evaluationRubric": [
    {"level": "Excellent", "criteria": "Specific criteria for a top score on this question"},
    {"level": "Good", "criteria": "What a solid but not outstanding answer looks like"},
    {"level": "Average", "criteria": "What a passable but unimpressive answer looks like"},
    {"level": "Poor", "criteria": "What would cause the interviewer to reject the candidate"}
  ],
  "redFlags": ["2-4 specific things that would immediately concern the interviewer"],
  "keywords": ["5-8 technical or domain keywords the candidate should naturally weave into their answer"],
  "confidenceTips": ["2-3 specific delivery tips for this question"]
}`;

  try {
    const text = await callAIWithRetry(prompt, "gemini-2.5-flash");
    let parsed = extractAndParseJSON(text);

    parsed = normalizeKeys(parsed);

    const requiredFields = ["whyAsked", "competency", "interviewerExpectations", "sampleAnswer", "commonMistakes", "followUpQuestions", "evaluationRubric"];
    requiredFields.forEach(f => {
      if (!parsed[f]) {
        parsed[f] = getFieldFallback(f, question, type);
      }
    });

    parsed.question = question;
    console.log(`✅ [AI] Generated unique answer for: "${question.substring(0, 60)}..."`);
    return parsed;

  } catch (err) {
    console.warn(`⚠️ AI answer generation failed for "${question.substring(0, 50)}...":`, err?.message);
    return getMinimalFallback(question, type);
  }
};

// ─────────────────────────────────────────
// Generate Base Suggestions & Questions (for direct/fallback use)
// ─────────────────────────────────────────
const generateBaseSuggestionsAndQuestions = async (matchedSkills, missingSkills, targetRole = "Software Engineer", resumeText = "") => {
  const fallbackSuggestions = [
    ...missingSkills.slice(0, 3).map(skill => `Learn ${skill} — it's required for this role.`),
    ...matchedSkills.slice(0, 2).map(skill => `Highlight your ${skill} experience with specific project examples.`)
  ].slice(0, 5);

  const fallbackTechnical = [
    ...matchedSkills.slice(0, 3).map(skill => `Explain your experience with ${skill} and a project you built.`),
    ...missingSkills.slice(0, 2).map(skill => `What do you know about ${skill}? How would you learn it quickly?`)
  ].slice(0, 5);

  const fallbackBehavioral = [
    "Tell me about a time you worked in a team under pressure.",
    "Describe a challenging bug you debugged and how you solved it.",
    "How do you prioritize tasks when working on multiple projects?",
    "Tell me about a failure and what you learned from it.",
    "Describe a situation where you had to learn a new technology quickly."
  ];

  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return {
      suggestions: fallbackSuggestions,
      technical: fallbackTechnical,
      behavioral: fallbackBehavioral
    };
  }

  try {
    const salt = crypto.randomBytes(4).toString("hex");

    let resumeHint = "";
    if (resumeText && resumeText.trim().length > 50) {
      resumeHint = `\nCandidate resume excerpt (use to generate relevant questions):\n${resumeText.substring(0, 800)}\n`;
    }

    const prompt = `You are a Senior Interview Coach at a top tech company.

A candidate is preparing for a "${targetRole}" role.
Their matched skills: ${matchedSkills.join(", ") || "none"}.
Their missing skills for the role: ${missingSkills.join(", ") || "none"}.
${resumeHint}
(Salt: ${salt})

Generate interview preparation content. Each question must be unique and specific — never generic.

Return ONLY valid JSON with this exact structure:
{
  "suggestions": ["5 specific resume/preparation tips tailored to THIS candidate's skill gaps"],
  "technical": ["5 unique technical interview questions testing specific competencies for ${targetRole}"],
  "behavioral": ["5 unique behavioral interview questions relevant to ${targetRole} roles"]
}`;

    const content = await callAIWithRetry(prompt, "gemini-2.5-flash");
    const parsed = extractAndParseJSON(content);
    return {
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : fallbackSuggestions,
      technical: Array.isArray(parsed.technical) ? parsed.technical : fallbackTechnical,
      behavioral: Array.isArray(parsed.behavioral) ? parsed.behavioral : fallbackBehavioral
    };
  } catch (err) {
    console.warn("⚠️ AI generation of base questions failed:", err?.message);
    return {
      suggestions: fallbackSuggestions,
      technical: fallbackTechnical,
      behavioral: fallbackBehavioral
    };
  }
};

// ─────────────────────────────────────────
// Main Batch Generation logic for all suggestions & guides
// ─────────────────────────────────────────
const generateBatchSuggestionsAndGuides = async (matchedSkills, missingSkills, targetRole, candidateSkills, profile, resumeText) => {
  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) return null;

  try {
    const salt = crypto.randomBytes(6).toString("hex");

    let profileContext = "";
    if (profile) {
      const parts = [];
      if (profile.careerGoal || profile.targetRole) parts.push(`Target Role: ${profile.targetRole || profile.careerGoal}`);
      if (profile.college) parts.push(`Education: ${profile.college}`);
      if (profile.graduationYear) parts.push(`Graduation Year: ${profile.graduationYear}`);
      if (parts.length > 0) {
        profileContext = `\nCandidate Profile:\n${parts.join("\n")}`;
      }
    }

    const skillsText = Array.isArray(candidateSkills) ? candidateSkills.join(", ") : String(candidateSkills);

    let resumeContext = "";
    if (resumeText && resumeText.trim().length > 50) {
      resumeContext = `\nCandidate Resume Summary:\n${resumeText.substring(0, 1000)}`;
    }

    const prompt = `You are a Senior Software Engineer and Lead Interview Coach at a top tier tech company (Google, OpenAI, Meta).
Generate 5 personalized preparation suggestions, 5 technical interview questions with deep guides, and 5 behavioral interview questions with deep guides.
All questions must be highly tailored to the candidate's target role: "${targetRole}".

Candidate Context:
- Matched Skills: ${matchedSkills.join(", ") || "None"}
- Missing Skills for Role: ${missingSkills.join(", ") || "None"}
- Candidate's All Skills: ${skillsText || "Not specified"}${profileContext}${resumeContext}

CRITICAL RULES:
1. Avoid generic templates. Every section and guide must be completely unique and specific.
2. The sample answers must sound like a real person talking during an interview, containing specific technologies and metrics.
3. Every single guide MUST contain all keys described in the JSON schema.
4. If candidate skills are provided, weave them naturally into sample answers where appropriate.

(Salt: ${salt})

Return ONLY valid JSON matching this schema:
{
  "suggestions": ["5 specific preparation/resume recommendations based on skill alignment"],
  "technical": [
    {
      "question": "A unique technical or system design question for ${targetRole}",
      "answer": {
        "category": "Technical | System Design",
        "difficulty": "Beginner | Intermediate | Advanced",
        "estimatedAnswerTime": "e.g. 2 minutes",
        "whyAsked": "A 2-3 sentence explanation of why this question is asked.",
        "competency": "Core competency tested",
        "interviewerExpectations": ["Expectation 1", "Expectation 2", "Expectation 3", "Expectation 4"],
        "answerFramework": "e.g. Define → Deep Dive → Application → Edge Cases",
        "keyTalkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
        "sampleAnswer": "150-250 word realistic, conversational sample answer with specific tech details.",
        "commonMistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
        "followUpQuestions": ["Follow up 1", "Follow up 2"],
        "evaluationRubric": [
          {"level": "Excellent", "criteria": "Criteria for top score"},
          {"level": "Good", "criteria": "Criteria for good score"},
          {"level": "Average", "criteria": "Criteria for average score"},
          {"level": "Poor", "criteria": "Criteria for poor score"}
        ],
        "redFlags": ["Red flag 1", "Red flag 2"],
        "keywords": ["keyword 1", "keyword 2", "keyword 3"],
        "confidenceTips": ["Tip 1", "Tip 2"]
      }
    }
  ],
  "behavioral": [
    {
      "question": "A unique behavioral question tailored to ${targetRole}",
      "answer": {
        "category": "Behavioral | Leadership",
        "difficulty": "Beginner | Intermediate | Advanced",
        "estimatedAnswerTime": "e.g. 90 seconds",
        "whyAsked": "A 2-3 sentence explanation of why this question is asked.",
        "competency": "Core competency tested",
        "interviewerExpectations": ["Expectation 1", "Expectation 2", "Expectation 3", "Expectation 4"],
        "answerFramework": "STAR Method",
        "keyTalkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
        "sampleAnswer": "150-250 word conversational STAR story using candidate's background/skills.",
        "commonMistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
        "followUpQuestions": ["Follow up 1", "Follow up 2"],
        "evaluationRubric": [
          {"level": "Excellent", "criteria": "Criteria for top score"},
          {"level": "Good", "criteria": "Criteria for good score"},
          {"level": "Average", "criteria": "Criteria for average score"},
          {"level": "Poor", "criteria": "Criteria for poor score"}
        ],
        "redFlags": ["Red flag 1", "Red flag 2"],
        "keywords": ["keyword 1", "keyword 2", "keyword 3"],
        "confidenceTips": ["Tip 1", "Tip 2"]
      }
    }
  ]
}`;

    const content = await callAIWithRetry(prompt, "gemini-2.5-flash");
    const parsed = extractAndParseJSON(content);

    if (!parsed || !Array.isArray(parsed.suggestions) || !Array.isArray(parsed.technical) || !Array.isArray(parsed.behavioral)) {
      throw new Error("Batch generation response does not match schema requirements");
    }

    const sanitizeGuides = (questionsArray, type) => {
      return questionsArray.map(item => {
        let answer = normalizeKeys(item.answer || {});
        const requiredFields = ["whyAsked", "competency", "interviewerExpectations", "sampleAnswer", "commonMistakes", "followUpQuestions", "evaluationRubric"];
        requiredFields.forEach(field => {
          if (!answer[field]) {
            answer[field] = getFieldFallback(field, item.question, type);
          }
        });
        if (!answer.category) {
          answer.category = type === "technical" ? "Technical" : "Behavioral";
        }
        return {
          question: item.question,
          answer
        };
      });
    };
    return {
      suggestions: parsed.suggestions,
      questions: {
        technical: sanitizeGuides(parsed.technical, "technical"),
        behavioral: sanitizeGuides(parsed.behavioral, "behavioral")
      }
    };
  } catch (err) {
    console.warn("⚠️ Batch suggestions & guides generation failed:", err?.message);
    return null;
  }
};

// ─────────────────────────────────────────
// Main Entry: Generate All Suggestions
// ─────────────────────────────────────────
export const generateSuggestions = async (context) => {
  const { pipelineId, resume, jobDescription, analysis, user } = context;
  const targetRole = user?.targetRole || "Software Engineer";
  const { matchedSkills, missingSkills } = analysis.original || analysis;

  console.log(`🚀 [${pipelineId}] [AI Engine] Generating Interview Batch...`);
  
  // We completely bypass the parallel fallback. 
  // We strictly use generateBatchSuggestionsAndGuides which returns everything in ONE call.
  // The LLMResponseParser guarantees it parses correctly.
  
  const batchResult = await withTimeout(
    generateBatchSuggestionsAndGuides(matchedSkills, missingSkills, targetRole, resume.structuredData.skills, user, resume.rawText),
    45000,
    null
  );
  
  if (batchResult) {
    console.log(`✅ [${pipelineId}] [AI Engine] Successfully generated batch data in one API call.`);
    return batchResult;
  }

  throw new Error(`[${pipelineId}] Failed to generate batched interview questions.`);
};

// ─────────────────────────────────────────
// Detailed ATS Report Fallback
// ─────────────────────────────────────────
const getDetailedAnalysisFallback = (matchedSkills, missingSkills, targetRole, isDomainMismatch, primaryReason) => {
  return {
    resumeSummary: "Resume text was parsed. Professional summary is temporarily unavailable due to API rate limits.",
    jdSummary: "Job description text was parsed. Job expectations overview is temporarily unavailable.",
    strengths: matchedSkills.length > 0 
      ? matchedSkills.slice(0, 3).map(s => `Candidate has matching experience in ${s}.`) 
      : ["Foundational professional background."],
    weaknesses: missingSkills.length > 0 
      ? missingSkills.slice(0, 3).map(s => `Missing target skill: ${s}.`) 
      : ["Some skill gaps relative to full job description."],
    hiringProbability: isDomainMismatch ? "Low" : (matchedSkills.length > 3 ? "Medium" : "Low"),
    atsFeedback: isDomainMismatch 
      ? `ATS has flagged a domain mismatch: ${primaryReason}`
      : "The resume contains solid matching credentials but would benefit from further targeted optimization.",
    domainAnalysis: isDomainMismatch 
      ? `Domain mismatch detected: ${primaryReason}`
      : `Both candidate experience and target role align with the general ${targetRole} field.`,
    experienceAnalysis: "Professional experience is listed but deep seniority level mapping is unavailable.",
    educationAnalysis: "Educational qualifications are listed on the resume.",
    projectAnalysis: "Project section exists on the resume and has been noted.",
    keywordAnalysis: `Keywords matched: ${matchedSkills.slice(0, 5).join(", ") || "None"}. Missing keywords: ${missingSkills.slice(0, 5).join(", ") || "None"}.`,
    gapAnalysis: `The main skill gaps are ${missingSkills.slice(0, 3).join(", ") || "minor"}.`,
    nextSteps: "1. Tailor your resume header.\n2. Add details for missing technical skills.\n3. Customize your project descriptions."
  };
};

// ─────────────────────────────────────────
// Core: Detailed ATS Report Generator
// ─────────────────────────────────────────
export const generateDetailedAnalysis = async ({ resumeText, jobDescription, matchedSkills, missingSkills, targetRole, isDomainMismatch, primaryReason }) => {
  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return getDetailedAnalysisFallback(matchedSkills, missingSkills, targetRole, isDomainMismatch, primaryReason);
  }

  const salt = crypto.randomBytes(4).toString("hex");
  const prompt = `You are a professional ATS Analyzer and Career Coach.
Analyze the following candidate resume text and target job description:

Target Role: ${targetRole}
Matched Skills: ${matchedSkills.join(", ") || "None"}
Missing Skills: ${missingSkills.join(", ") || "None"}
Is Domain Mismatch: ${isDomainMismatch ? "Yes" : "No"}
Mismatch Reason: ${primaryReason || "None"}

Candidate Resume:
${resumeText.substring(0, 3000)}

Job Description:
${jobDescription.substring(0, 3000)}

(Salt: ${salt})

Provide a comprehensive, high-quality, professional ATS analysis report. Write in a tailored, insightful tone. Do not use generic statements.

Return ONLY a valid JSON object matching this exact schema (no markdown formatting, no explanations):
{
  "resumeSummary": "A concise 2-3 sentence professional summary of the candidate's background.",
  "jdSummary": "A concise 2-3 sentence overview of what the job description requires.",
  "strengths": ["3 key strengths of the resume relative to this JD"],
  "weaknesses": ["3 key gaps/weaknesses of the resume relative to this JD"],
  "hiringProbability": "High | Medium | Low",
  "atsFeedback": "A 3-4 sentence comprehensive feedback from the perspective of an applicant tracking system.",
  "domainAnalysis": "An evaluation of the domain/industry match between candidate and JD.",
  "experienceAnalysis": "An evaluation of their years of experience and level of seniority alignment.",
  "educationAnalysis": "An evaluation of their educational qualifications alignment.",
  "projectAnalysis": "An evaluation of their projects and how they match the target role responsibilities.",
  "keywordAnalysis": "An analysis of critical keywords that are present or missing.",
  "gapAnalysis": "An actionable gap analysis detailing what the candidate must focus on to bridge differences.",
  "nextSteps": "A clear, numbered checklist of next steps the candidate should take."
}`;

  try {
    const content = await callAIWithRetry(prompt, "openrouter/free");
    
    console.log("Raw LLM Detailed Analysis Response:");
    console.log(content);

    const parsed = extractAndParseJSON(content);
    return {
      ...getDetailedAnalysisFallback(matchedSkills, missingSkills, targetRole, isDomainMismatch, primaryReason),
      ...parsed
    };
  } catch (err) {
    console.warn("⚠️ Detailed analysis generation failed, using fallback:", err.message);
    return getDetailedAnalysisFallback(matchedSkills, missingSkills, targetRole, isDomainMismatch, primaryReason);
  }
};