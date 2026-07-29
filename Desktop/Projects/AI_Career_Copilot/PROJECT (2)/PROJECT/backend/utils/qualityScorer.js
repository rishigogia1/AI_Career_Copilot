/**
 * Calculates a multidimensional Quality Score for the resume.
 * Formula: 40% ATS + 20% Semantic + 15% Keyword Gain + 10% Readability + 10% Critic Improvements + 5% Formatting
 */
export const calculateQualityScore = ({
  candidateMatch,
  baselineMatch,
  candidateText,
  originalText,
  criticReport,
  candidateCriticReport
}) => {
  const ats = candidateMatch.finalScore || 0;
  const semantic = candidateMatch.semanticScore || 0;

  // 1. Keyword Gain (0-100)
  const baselineKeys = new Set(baselineMatch.matchedSkills || []);
  const candidateKeys = new Set(candidateMatch.matchedSkills || []);
  const addedCount = [...candidateKeys].filter(k => !baselineKeys.has(k)).length;
  const keywordGain = Math.min(100, addedCount * 20); // 5+ keywords added gets 100%

  // 2. Readability (0-100)
  const lines = candidateText.split("\n").map(l => l.trim()).filter(Boolean);
  const avgLineLength = lines.reduce((acc, l) => acc + l.length, 0) / (lines.length || 1);
  let readability = 100;
  if (avgLineLength > 120) readability -= 20;
  if (avgLineLength < 30) readability -= 15;
  readability = Math.max(0, readability);

  // 3. Resume Critic Improvements (0-100)
  const baselineIssuesCount = 
    (criticReport.semanticWeaknesses?.length || 0) +
    (criticReport.keywordWeaknesses?.length || 0) +
    (criticReport.experienceWeaknesses?.length || 0) +
    (criticReport.formattingWeaknesses?.length || 0) +
    (criticReport.missingAchievements?.length || 0);

  const candidateIssuesCount = 
    (candidateCriticReport.semanticWeaknesses?.length || 0) +
    (candidateCriticReport.keywordWeaknesses?.length || 0) +
    (candidateCriticReport.experienceWeaknesses?.length || 0) +
    (candidateCriticReport.formattingWeaknesses?.length || 0) +
    (candidateCriticReport.missingAchievements?.length || 0);

  const criticImprovements = baselineIssuesCount > 0 
    ? Math.round(Math.max(0, (baselineIssuesCount - candidateIssuesCount) / baselineIssuesCount) * 100)
    : 100;

  // 4. Formatting (0-100)
  let formatting = 100;
  if (lines.length > 80) formatting -= 15; // too long
  if (!candidateText.toLowerCase().includes("skills")) formatting -= 20;
  formatting = Math.max(0, formatting);

  const overallScore = Math.round(
    (ats * 0.40) +
    (semantic * 0.20) +
    (keywordGain * 0.15) +
    (readability * 0.10) +
    (criticImprovements * 0.10) +
    (formatting * 0.05)
  );

  return {
    overallScore,
    ats,
    semantic,
    keywordGain,
    readability,
    criticImprovements,
    formatting
  };
};
