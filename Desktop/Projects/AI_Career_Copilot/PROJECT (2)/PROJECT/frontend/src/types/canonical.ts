export interface CanonicalResume {
    version: 1;
    rawText: string;
    structuredData: {
        summary: string;
        skills: string[];
        technologies: string[];
        tools: string[];
        frameworks: string[];
        projects: any[];
        experience: any[];
        education: any[];
        certifications: any[];
    };
}

export interface CanonicalAnalysis {
    version: 1;
    atsScore: number;
    skillScore: number;
    semanticScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    gapAnalysis: string[];
    sectionAnalysis: any;
    protectedKeywords: string[];
    debug: any;
}

export interface OptimizationPlan {
    protectedKeywords: string[];
    targetKeywords: string[];
    lockedSections: string[];
    editableSections: string[];
    retryCount: number;
}

export interface PipelineContext {
    pipelineId: string;
    resume: CanonicalResume;
    jobDescription: string;
    analysis: CanonicalAnalysis;
    user: any;
    cache: any;
    diagnostics: any;
    optimizationPlan?: OptimizationPlan;
}
