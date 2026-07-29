export interface ATSAnalysis {
  version: 2;
  
  // High-level summaries
  summary: string;
  jdSummary: string;
  atsScore: number;
  
  // Core Extractions
  matchedSkills: string[];
  missingSkills: string[];
  
  // AI Evaluations
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  // Domain Match
  domainResume?: string;
  domainJD?: string;
  isDomainMismatch?: boolean;
  primaryReason?: string;
  
  // Detailed Section Analysis
  sectionAnalysis?: {
    experienceAnalysis?: string;
    educationAnalysis?: string;
    projectAnalysis?: string;
    keywordAnalysis?: string;
  };
  
  // Additional diagnostic/legacy stuff wrapped safely
  debug?: any;
}
