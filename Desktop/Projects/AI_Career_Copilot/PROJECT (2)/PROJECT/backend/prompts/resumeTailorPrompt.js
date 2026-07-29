export const compressJobDescription = (jdText) => {
  if (!jdText) return {};
  const lines = jdText.split("\n").map(l => l.trim()).filter(Boolean);
  
  const responsibilities = [];
  const requiredSkills = [];
  const preferredSkills = [];
  
  let currentGroup = "general";
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("responsibilit") || lower.includes("what you will do")) {
      currentGroup = "responsibilities";
    } else if (lower.includes("require") || lower.includes("qualification") || lower.includes("must have")) {
      currentGroup = "required";
    } else if (lower.includes("preferred") || lower.includes("nice to have") || lower.includes("plus")) {
      currentGroup = "preferred";
    }
    
    if (line.length > 5 && line.length < 150) {
      if (currentGroup === "responsibilities") {
        responsibilities.push(line);
      } else if (currentGroup === "required") {
        requiredSkills.push(line);
      } else if (currentGroup === "preferred") {
        preferredSkills.push(line);
      }
    }
  }

  return {
    title: lines[0] || "Target Role",
    requiredSkills: requiredSkills.slice(0, 8),
    preferredSkills: preferredSkills.slice(0, 5),
    responsibilities: responsibilities.slice(0, 8)
  };
};

/**
 * Builds the customized optimization prompt with explicit Critic / Planner directives.
 */
export const buildResumeTailorPrompt = (resumeJSON, jdJSON, missingSkills = [], protectedKeywords = [], optimizationPlan = null) => {
  const compressedJD = typeof jdJSON === "string" ? compressJobDescription(jdJSON) : jdJSON;

  let planBlock = "";
  if (optimizationPlan) {
    const weakSecDetails = optimizationPlan.weakSections.map(ws => 
      `- ${ws.section} (Severity: ${ws.severity}): ${ws.reason} -> Action: ${ws.action}`
    ).join("\n");

    planBlock = `
CRITIQUE & PLAN OBJECTIVES:
Current ATS Score: ${optimizationPlan.currentATS}%
Target ATS Score: ${optimizationPlan.targetATS}%

Weak Sections to Edit:
${weakSecDetails}

Protected Sections (Do NOT modify, delete, or rename these sections or contents):
${optimizationPlan.protectedSections.join(", ")}
`;
  }

  let protectedKeywordsBlock = "";
  if (protectedKeywords.length > 0) {
    protectedKeywordsBlock = `
PROTECTED KEYWORDS (Keep these exact terms verbatim in the updated content):
${protectedKeywords.join(", ")}
`;
  }

  return `You are a professional Executive Resume Writer and ATS Optimization Expert.
Your task is to tailor specific sections of the candidate's resume for the target job description to resolve critical skill gaps while maintaining strict factual integrity.

CRITICAL RULES:
1. STRICT ANTI-FABRICATION: You must NEVER fabricate or hallucinate Companies, Dates, Projects, Experience, Metrics, or Achievements.
2. EDITING PRIORITIES:
   - Priority 1: Integrate missing technologies already supported by the resume.
   - Priority 2: Strengthen project bullets using measurable impact.
   - Priority 3: Rewrite summary.
   - Priority 4: Expand skills section (only if factually supported by original data).
3. DIFFERENTIAL REWRITE: Do NOT rewrite the entire resume. Return ONLY the modified sections.
4. PRESERVE STRONG CONTENT: Never remove existing quantified achievements, metrics, technical skills already matching the Job Description, strong action verbs, or relevant project details.
5. JSON FORMAT ONLY: Your response must be a single, valid JSON object matching the requested schema. No explanation, no markdown wraps.
${planBlock}
${protectedKeywordsBlock}

Original Resume Data (Structured JSON):
${JSON.stringify(resumeJSON, null, 2)}

Target Job Description (Compressed):
${JSON.stringify(compressedJD, null, 2)}

Missing Skills to Target:
${missingSkills.join(", ")}

Return ONLY a JSON object matching this exact schema:
{
  "professionalSummary": "The updated professional summary (if changes are needed, otherwise null)",
  "skills": null,
  "modifiedProjects": [
    {
      "title": "Exact Title of the project being modified",
      "description": "Rewritten project bullet points / description to incorporate key terms and improve ATS fit."
    }
  ],
  "modifiedExperience": [
    {
      "company": "Exact Company Name",
      "role": "Exact Role Name",
      "description": "Rewritten experience bullet points to highlight relevant skills."
    }
  ],
  "changesSummary": ["Specific modifications made (e.g. 'Rewrote AI Career Copilot project to highlight React and Node.js')"],
  "reasoning": "A brief explanation of the optimization strategy."
}

IMPORTANT: Set "skills" to null. Do NOT modify the skills array. Skills injection causes ATS score degradation.
`;
};

export const buildCorrectiveTailorPrompt = (resumeJSON, jdJSON, missingSkills, structuredFeedback, protectedKeywords = [], optimizationPlan = null, previousDiff = null) => {
  const basePrompt = buildResumeTailorPrompt(resumeJSON, jdJSON, missingSkills, protectedKeywords, optimizationPlan);
  
  let previousDiffBlock = "";
  if (previousDiff) {
    previousDiffBlock = `
PREVIOUS GENERATED CANDIDATE DIFF:
${JSON.stringify(previousDiff, null, 2)}
`;
  }

  return `${basePrompt}

⚠️ CORRECTIVE FEEDBACK — PREVIOUS ATTEMPT REJECTED:
Your previous optimization attempt was evaluated and did not meet quality or constraint goals.

STRUCTURED REJECTION FEEDBACK:
${JSON.stringify(structuredFeedback, null, 2)}
${previousDiffBlock}

CORRECTIVE INSTRUCTIONS:
- Modify or build upon the previous attempt rather than starting from scratch.
- Target sections marked to edit and strictly avoid modifying sections that are locked.
- Set "skills" to null. Do NOT modify skills.

Return the corrected JSON diff following the exact same schema.`;
};
