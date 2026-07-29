import { normalizeSkill } from "./atsNormalizer.js";

// A curated set of tech categories/keywords to distinguish tech from soft/generic skills
const TECH_TERMS = new Set([
  "python", "javascript", "typescript", "java", "c++", "golang", "rust", "c#", "php", "ruby", "swift", "kotlin",
  "react", "angular", "vue", "node", "node.js", "express", "django", "flask", "fastapi", "spring", "spring boot",
  "next.js", "nuxt", "svelte", "jquery", "bootstrap", "tailwind", "pytorch", "tensorflow", "keras", "scikit-learn",
  "pandas", "numpy", "matplotlib", "seaborn", "llamaindex", "langchain", "huggingface", "transformers", "openai",
  "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ansible", "git", "github", "gitlab",
  "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "sqlite", "mariadb", "oracle", "cassandra", "dynamodb",
  "sql", "nosql", "firebase", "graphql", "rest api", "soap", "grpc", "html", "css", "sass", "less", "webpack", "vite",
  "ci/cd", "devops", "linux", "unix", "windows", "macos", "docker-compose", "bash", "shell", "power bi", "tableau",
  "excel", "jira", "confluence", "trello", "slack", "figma", "postman", "swagger", "s3", "ec2", "rds", "lambda"
]);

/**
 * Extracts protected keywords from baseline matched skills.
 */
export const extractProtectedKeywords = (matchedSkills, resumeText) => {
  if (!Array.isArray(matchedSkills) || !resumeText) return [];
  
  const resumeLower = resumeText.toLowerCase();
  
  return matchedSkills.filter(skill => {
    const normalized = normalizeSkill(skill).toLowerCase().trim();
    if (!normalized || normalized.length <= 1) return false;
    
    // Check if it matches tech terms or is a word in the resume text
    const isTech = TECH_TERMS.has(normalized) || [...TECH_TERMS].some(term => normalized.includes(term));
    const inResume = resumeLower.includes(normalized);
    
    return isTech && inResume;
  });
};

/**
 * Calculates penalty for missing protected keywords.
 */
export const calculateProtectedKeywordPenalty = (protectedKeywords, candidateText) => {
  if (!Array.isArray(protectedKeywords) || !candidateText) {
    return { missingKeywords: [], penalty: 0, presentKeywords: [] };
  }
  
  const candidateLower = candidateText.toLowerCase();
  const missingKeywords = [];
  const presentKeywords = [];
  let penalty = 0;
  
  for (const kw of protectedKeywords) {
    const kwLower = kw.toLowerCase().trim();
    
    // Use word boundaries/simple includes to detect presence
    const isPresent = candidateLower.includes(kwLower);
    
    if (isPresent) {
      presentKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
      
      // Determine penalty based on term prominence
      if (TECH_TERMS.has(kwLower)) {
        penalty += 2; // Tech term missing
      } else {
        penalty += 1; // Tool/other term missing
      }
    }
  }
  
  // Cap the penalty at 8 points
  const finalPenalty = Math.min(8, penalty);
  
  return {
    missingKeywords,
    presentKeywords,
    penalty: finalPenalty
  };
};
