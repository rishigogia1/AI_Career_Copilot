import { normalizeSkill } from "./atsNormalizer.js";

/**
 * Creates a targeted ATS Optimization Plan.
 */
export const buildOptimizationPlan = ({ baselineMatch, resumeJSON, resumeText, jobDescription, criticReport }) => {
  const critic = criticReport || { semanticWeaknesses: [], keywordWeaknesses: [], experienceWeaknesses: [], formattingWeaknesses: [], missingAchievements: [] };
  const currentATS = baselineMatch.finalScore || 0;
  const targetATS = Math.min(98, currentATS + 15);
  const missingKeywords = baselineMatch.missingSkills || [];
  
  const weakSections = [];

  // Summary analysis
  const summary = resumeJSON?.professionalSummary || "";
  const summaryLower = summary.toLowerCase();
  const summaryMissing = missingKeywords.filter(kw => !summaryLower.includes(kw.toLowerCase()));
  
  if (summaryMissing.length > 0 || currentATS < 70) {
    weakSections.push({
      section: "Summary",
      severity: "High",
      reason: "Missing critical job description keywords.",
      action: "Rewrite"
    });
  }

  // Skills analysis
  const skills = resumeJSON?.skills || [];
  const skillsLower = skills.map(s => s.toLowerCase());
  const verifiedMissingSkills = missingKeywords.filter(kw => !skillsLower.includes(kw.toLowerCase()));
  
  if (verifiedMissingSkills.length > 0) {
    weakSections.push({
      section: "Skills",
      severity: "High",
      reason: "Missing verified target JD technologies.",
      action: "Append"
    });
  }

  // Experience and Projects analysis
  const projects = resumeJSON?.projects || "";
  if (projects && (critic.missingAchievements.length > 0 || currentATS < 80)) {
    weakSections.push({
      section: "Projects",
      severity: "Medium",
      reason: "Needs measurable outcomes and stronger action verbs.",
      action: "Rewrite Bullets"
    });
  }

  const experience = resumeJSON?.experience || "";
  if (experience && critic.experienceWeaknesses.length > 0) {
    weakSections.push({
      section: "Experience",
      severity: "Medium",
      reason: "Needs technical action verb optimizations.",
      action: "Rewrite Bullets"
    });
  }

  return {
    currentATS,
    targetATS,
    weakSections,
    protectedSections: [
      "Education",
      "Dates",
      "Company Names"
    ]
  };
};
