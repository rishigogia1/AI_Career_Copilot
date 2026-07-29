/**
 * Performs a deep diff and optimization metrics analysis between original and candidate resumes.
 */
export const analyzeResumeDiff = (originalText, candidateText, originalJSON = null, candidateJSON = null) => {
  const sectionsModified = [];
  
  if (originalJSON && candidateJSON) {
    if (originalJSON.professionalSummary !== candidateJSON.professionalSummary) {
      sectionsModified.push("professionalSummary");
    }
    if (originalJSON.projects !== candidateJSON.projects) {
      sectionsModified.push("projects");
    }
    if (originalJSON.experience !== candidateJSON.experience) {
      sectionsModified.push("experience");
    }
    if (originalJSON.skills !== candidateJSON.skills) {
      sectionsModified.push("skills");
    }
  }

  const getWords = (text) => new Set(text.toLowerCase().split(/[^a-z0-9+#\.]+/).filter(w => w.length > 1));
  const originalWords = getWords(originalText);
  const candidateWords = getWords(candidateText);

  const keywordsAdded = [...candidateWords].filter(w => !originalWords.has(w));
  const keywordsRemoved = [...originalWords].filter(w => !candidateWords.has(w));

  // Action verbs check
  const actionVerbs = new Set([
    "orchestrated", "engineered", "scaled", "designed", "implemented", "delivered", "streamlined",
    "pioneered", "championed", "led", "architected", "optimized", "spearheaded", "revamped"
  ]);
  const originalVerbs = originalText.toLowerCase().split(/[^a-z]+/).filter(w => actionVerbs.has(w));
  const candidateVerbs = candidateText.toLowerCase().split(/[^a-z]+/).filter(w => actionVerbs.has(w));
  const verbsAdded = [...new Set(candidateVerbs)].filter(v => !originalVerbs.includes(v));

  // Quantified metrics (regex matches numbers with %, $, +, etc)
  const countMetrics = (text) => (text.match(/\b\d+(%|\+)?\b/g) || []).length;
  const originalMetrics = countMetrics(originalText);
  const candidateMetrics = countMetrics(candidateText);
  const metricsCount = Math.max(0, candidateMetrics - originalMetrics);

  // Readability comparison
  const lines = candidateText.split("\n").map(l => l.trim()).filter(Boolean);
  const avgLineLength = lines.reduce((acc, l) => acc + l.length, 0) / (lines.length || 1);
  let readabilityStatus = "Optimal";
  if (avgLineLength > 120) readabilityStatus = "Too verbose";
  if (avgLineLength < 30) readabilityStatus = "Too brief";

  // Check for locked structural section modifications
  const lockedSectionsViolated = [];
  if (originalJSON && candidateJSON) {
    if (originalJSON.education && originalJSON.education !== candidateJSON.education) {
      lockedSectionsViolated.push("education");
    }
  }

  return {
    sectionsModified,
    keywordsAdded: keywordsAdded.slice(0, 15),
    keywordsRemoved: keywordsRemoved.slice(0, 15),
    verbsAdded,
    metricsCount,
    readability: readabilityStatus,
    lockedSectionsViolated
  };
};
