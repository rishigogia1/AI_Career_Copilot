/**
 * Generates an end-user facing recommendation report explaining optimizations.
 */
export const generateRecommendationReport = ({ baselineMatch, candidateMatch, diffReport, qualityScores }) => {
  const atsDiff = (candidateMatch.finalScore || 0) - (baselineMatch.finalScore || 0);
  const atsImprovement = atsDiff >= 0 ? `+${atsDiff}%` : `${atsDiff}%`;
  
  const enhancementBulletPoints = [];
  if (qualityScores.keywordGain > 0) {
    enhancementBulletPoints.push(`Successfully integrated missing target technologies: ${diffReport.keywordsAdded.slice(0, 5).join(", ")}.`);
  }
  if (qualityScores.criticImprovements > 0) {
    enhancementBulletPoints.push("Addressed critical ATS deductions and semantic weaknesses.");
  }
  if (diffReport.summaryChanged) {
    enhancementBulletPoints.push("Tailored the Professional Summary to align with target role expectations.");
  }
  if (diffReport.sectionsModified.includes("projects")) {
    enhancementBulletPoints.push("Optimized project descriptions with strong action verbs and metrics.");
  }

  const candidateMatched = candidateMatch.matchedSkills || [];
  const baselineMatched = baselineMatch.matchedSkills || [];

  return {
    atsImprovement,
    addedKeywords: diffReport.keywordsAdded,
    removedKeywords: diffReport.keywordsRemoved,
    preservedProtected: candidateMatched.filter(s => baselineMatched.includes(s)),
    enhancementBulletPoints: enhancementBulletPoints.length > 0 ? enhancementBulletPoints : ["Grammar and layout readability optimized."],
    scoreBreakdown: {
      ats: candidateMatch.finalScore,
      overallQuality: qualityScores.overallScore,
      semantic: qualityScores.semantic,
      keywordGain: qualityScores.keywordGain,
      readability: qualityScores.readability,
      criticImprovements: qualityScores.criticImprovements,
      formatting: qualityScores.formatting
    }
  };
};
