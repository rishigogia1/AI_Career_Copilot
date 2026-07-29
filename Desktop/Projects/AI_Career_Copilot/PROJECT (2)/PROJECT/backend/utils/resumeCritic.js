/**
 * Analyses the baseline ATS score metrics and highlights weaknesses.
 */
export const criticizeResume = ({ baselineMatch, resumeText, jobDescription }) => {
  const semanticWeaknesses = [];
  const keywordWeaknesses = [];
  const experienceWeaknesses = [];
  const formattingWeaknesses = [];
  const missingAchievements = [];

  // 1. Semantic Weaknesses
  if ((baselineMatch.semanticScore || 0) < 60) {
    semanticWeaknesses.push("Semantic similarity is low. The resume uses generic terms instead of job-specific keywords.");
    semanticWeaknesses.push("Summary or experience description context does not strongly match the target role domain.");
  }

  // 2. Keyword Weaknesses
  const missing = baselineMatch.missingSkills || [];
  if (missing.length > 0) {
    keywordWeaknesses.push(...missing.slice(0, 5).map(skill => `Missing critical technology/skill: "${skill}"`));
  }

  // 3. Experience & Bullet Point Weaknesses
  const lines = resumeText.split("\n").map(l => l.trim()).filter(Boolean);
  const bulletPoints = lines.filter(l => /^[•\-\*]/.test(l));
  
  if (bulletPoints.length === 0) {
    experienceWeaknesses.push("No bullet points found in the experience section. Use bullet points to list responsibilities.");
  } else {
    const actionVerbs = new Set(["orchestrated", "engineered", "scaled", "designed", "implemented", "delivered"]);
    const weakBullets = bulletPoints.filter(bp => {
      const words = bp.toLowerCase().split(/[^a-z]+/);
      return !words.some(w => actionVerbs.has(w));
    });
    if (weakBullets.length > 0) {
      experienceWeaknesses.push(`${weakBullets.length} experience bullet points do not start with strong technical action verbs.`);
    }
  }

  // 4. Missing Achievements & Quantification
  const metricBullets = bulletPoints.filter(bp => /\b\d+(%|\+)?\b/.test(bp));
  if (metricBullets.length < Math.max(1, bulletPoints.length * 0.3)) {
    missingAchievements.push("Insufficient quantified impact (numbers, percentages, metrics). Resume needs evidence of business value.");
  }

  // 5. Formatting Weaknesses
  if (lines.length > 100) {
    formattingWeaknesses.push("Resume is too verbose and exceeds optimal reading length.");
  }
  if (!resumeText.toLowerCase().includes("skills")) {
    formattingWeaknesses.push("No explicit 'SKILLS' header section found.");
  }

  return {
    semanticWeaknesses,
    keywordWeaknesses,
    experienceWeaknesses,
    formattingWeaknesses,
    missingAchievements
  };
};
