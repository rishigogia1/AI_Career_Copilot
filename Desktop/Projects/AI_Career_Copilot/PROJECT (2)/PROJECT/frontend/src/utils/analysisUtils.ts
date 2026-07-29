import { ATSAnalysis } from "../types/analysis";

export const assertAnalysisShape = (analysis: Partial<ATSAnalysis> | null | undefined): ATSAnalysis => {
  if (!analysis) {
    console.error("[INVALID_ANALYSIS_OBJECT] Analysis is null or undefined.");
    if (process.env.NODE_ENV === "development") {
      throw new Error("INVALID_ANALYSIS_OBJECT: Analysis is null or undefined.");
    }
    return getFallbackAnalysis();
  }

  const missingFields: string[] = [];

  if (typeof analysis.summary !== 'string') missingFields.push("summary");
  if (!Array.isArray(analysis.matchedSkills)) missingFields.push("matchedSkills");
  if (!Array.isArray(analysis.missingSkills)) missingFields.push("missingSkills");
  if (!Array.isArray(analysis.recommendations)) missingFields.push("recommendations");
  if (!Array.isArray(analysis.strengths)) missingFields.push("strengths");
  if (!Array.isArray(analysis.weaknesses)) missingFields.push("weaknesses");
  if (typeof analysis.atsScore !== 'number') missingFields.push("atsScore");

  if (missingFields.length > 0) {
    console.error(`[INVALID_ANALYSIS_OBJECT] Missing or invalid fields: ${missingFields.join(", ")}`, analysis);
    if (process.env.NODE_ENV === "development") {
      throw new Error(`INVALID_ANALYSIS_OBJECT: Missing or invalid fields: ${missingFields.join(", ")}`);
    }
    
    // In production, try to patch it up so it doesn't white-screen
    return {
      version: 2,
      summary: analysis.summary || "",
      jdSummary: analysis.jdSummary || "",
      atsScore: analysis.atsScore || 0,
      matchedSkills: analysis.matchedSkills || [],
      missingSkills: analysis.missingSkills || [],
      strengths: analysis.strengths || [],
      weaknesses: analysis.weaknesses || [],
      recommendations: analysis.recommendations || [],
      domainResume: analysis.domainResume,
      domainJD: analysis.domainJD,
      isDomainMismatch: analysis.isDomainMismatch,
      primaryReason: analysis.primaryReason,
      sectionAnalysis: analysis.sectionAnalysis || {},
      debug: analysis.debug
    };
  }

  // Freeze in development to prevent accidental mutations
  if (process.env.NODE_ENV === "development") {
    return Object.freeze({ ...analysis }) as ATSAnalysis;
  }

  return analysis as ATSAnalysis;
};

const getFallbackAnalysis = (): ATSAnalysis => ({
  version: 2,
  summary: "Analysis unavailable.",
  jdSummary: "Job description unavailable.",
  atsScore: 0,
  matchedSkills: [],
  missingSkills: [],
  strengths: [],
  weaknesses: [],
  recommendations: [],
});
