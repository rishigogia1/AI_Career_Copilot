export const normalizeSkill = (skill) => {
  if (!skill) return "";
  
  // 1. Lowercase and trim
  let s = String(skill).toLowerCase().trim();
  
  // 2. Remove special characters but preserve '+', '#', and '.' (so we don't break C++, C#, .NET, Node.js)
  s = s.replace(/[^a-z0-9\s\+#\.]/g, " ");
  
  // 3. Normalize spaces
  s = s.replace(/\s+/g, " ").trim();
  
  // 4. Synonym Mapping (canonical names)
  const map = {
    "machine design": "mechanical design",
    "mechanical design": "mechanical design",
    "cad design": "cad modeling",
    "cad modeling": "cad modeling",
    "fea": "finite element analysis",
    "finite element analysis": "finite element analysis",
    "finite element analysis (fea)": "finite element analysis",
    "ansys": "finite element analysis",
    "stress analysis": "finite element analysis",
    "production engineering": "production engineering",
    "production optimization": "production engineering",
    "quality inspection": "quality control",
    "quality control": "quality control",
    "engineering drawings": "engineering drawing",
    "engineering drawing": "engineering drawing",
    "sae baja": "sae baja",
    "baja sae": "sae baja",
    "autocad": "autocad",
    "solidworks": "solidworks",
    "catia": "catia",
    "matlab": "matlab",
    
    // Core tech & ML mappings for backward compatibility
    "ml": "machine learning",
    "machine learning": "machine learning",
    "ml engineering": "machine learning",
    "js": "javascript",
    "javascript": "javascript",
    "node": "node.js",
    "node.js": "node.js",
    "py": "python",
    "python": "python",

    // New GenAI & General Tech mappings
    "gpt": "openai gpt",
    "gpt 4": "openai gpt",
    "gpt api": "openai gpt",
    "openai gpt": "openai gpt",
    "rest apis": "rest api",
    "restful apis": "rest api",
    "rest api": "rest api",
    "llms": "large language models",
    "llm": "large language models",
    "large language model": "large language models",
    "large language models": "large language models",
    "rag": "retrieval augmented generation",
    "retrieval augmented generation": "retrieval augmented generation",
    "google cloud": "google cloud platform",
    "gcp": "google cloud platform",
    "google cloud platform": "google cloud platform",
    "reactjs": "react",
    "react.js": "react",
    "react": "react"
  };
  
  return map[s] || s;
};

export const uniqNormalized = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map(normalizeSkill).filter(Boolean))];
};
