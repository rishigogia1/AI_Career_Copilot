import { cacheGet, cacheSet, sha256 } from "./cacheService.js";
import { normalizeSkill } from "./atsNormalizer.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const normalizeForEmbedding = (text) => {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
};

const tokenize = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
};

const isIgnoredToken = (token) => {
  const t = token.toLowerCase().trim();
  if (!t) return true;

  // Email check
  if (t.includes("@") || t.includes("mailto:") || t.endsWith(".com") || t.endsWith(".org") || t.endsWith(".net") || t.endsWith(".edu") || t.endsWith(".in")) return true;

  // Phone numbers (sequences of >= 5 digits)
  if (/^\d{5,}$/.test(t)) return true;

  // Dates: years (1900-2099)
  if (/^(19|20)\d{2}$/.test(t)) return true;

  // Month names
  const months = [
    "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
    "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sept", "sep", "oct", "nov", "dec"
  ];
  if (months.includes(t)) return true;

  // Common address keywords
  const addressKeywords = [
    "street", "road", "drive", "lane", "avenue", "boulevard", "highway", "suite", "apt", "apartment",
    "st", "rd", "dr", "ln", "ave", "blvd", "hwy", "zipcode", "pincode", "address"
  ];
  if (addressKeywords.includes(t)) return true;

  // Date indicator words
  const dateIndicators = ["present", "current", "since", "from", "to", "duration"];
  if (dateIndicators.includes(t)) return true;

  // Names / Contact indicators: "phone", "email", "mobile", "contact", "name", "tel", "fax"
  const contactWords = ["phone", "email", "mobile", "contact", "name", "tel", "fax"];
  if (contactWords.includes(t)) return true;

  // Formatting tokens (single characters unless 'c' or 'r')
  if (t.length === 1 && !["c", "r"].includes(t)) return true;

  return false;
};

export const getEmbedding = async ({ text, kind }) => {
  const normText = normalizeForEmbedding(text);
  const key = sha256(normText);
  const cached = cacheGet("embeddings", `${kind}:${key}`);

  if (cached) return cached;

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(normText);
      const embedding = result.embedding.values;
      cacheSet("embeddings", `${kind}:${key}`, embedding);
      return embedding;
    } catch (err) {
      console.warn("⚠️ Embedding model failed, falling back to tokens:", err.message);
    }
  }

  const tokens = tokenize(normText);
  cacheSet("embeddings", `${kind}:${key}`, tokens);
  return tokens;
};

export const getSemanticSimilarityScore = async ({
  resumeText,
  jdText,
  extractedResumeData,
  extractedJDData
}) => {
  try {
    const resumeEmb = await getEmbedding({ text: resumeText, kind: "resume_full" });
    const jdEmb = await getEmbedding({ text: jdText, kind: "jd_full" });

    if (Array.isArray(resumeEmb) && typeof resumeEmb[0] === 'number' && Array.isArray(jdEmb) && typeof jdEmb[0] === 'number') {
      const cosSim = cosineSimilarity(resumeEmb, jdEmb);
      let semanticScore = Math.max(0, Math.min(100, Math.round(cosSim * 100)));
      return {
        semanticScore,
        embeddingDebug: {
          similarityMethod: "cosine_similarity_gemini",
          rawCosineScore: cosSim
        }
      };
    }
  } catch (err) {
    console.warn("⚠️ Embedding extraction failed, falling back to Jaccard.", err.message);
  }

  const resData = extractedResumeData || {};
  const jdData = extractedJDData || {};

  // 1. Skill overlap score
  const combineAllSkillsLocal = (data) => {
    return [
      ...(data.skills || []),
      ...(data.tools || []),
      ...(data.technologies || []),
      ...(data.frameworks || []),
      ...(data.softSkills || [])
    ].map(x => String(x).trim()).filter(Boolean);
  };

  const resumeSkills = [...new Set(combineAllSkillsLocal(resData).map(normalizeSkill))];
  const jdSkills = [...new Set(combineAllSkillsLocal(jdData).map(normalizeSkill))];

  const skillIntersection = resumeSkills.filter(x => jdSkills.includes(x)).length;
  const skillUnion = new Set([...resumeSkills, ...jdSkills]).size;
  const skillOverlapScore = skillUnion === 0 ? 0 : skillIntersection / skillUnion;

  // Helper to extract tokens from a text array, filtering out ignored ones
  const getFilteredTokens = (arr) => {
    const tokens = [];
    for (const item of (arr || [])) {
      const itemTokens = tokenize(item);
      for (const tok of itemTokens) {
        if (!isIgnoredToken(tok)) {
          tokens.push(tok);
        }
      }
    }
    return new Set(tokens);
  };

  // 2. Project overlap score
  const setResumeProjects = getFilteredTokens(resData.projects);
  const setJdProjects = getFilteredTokens(jdData.projects);
  const projectIntersection = [...setResumeProjects].filter(x => setJdProjects.has(x)).length;
  const projectUnion = new Set([...setResumeProjects, ...setJdProjects]).size;
  const projectOverlapScore = projectUnion === 0 ? 0 : projectIntersection / projectUnion;

  // 3. Experience overlap score
  const setResumeExperience = getFilteredTokens(resData.experience);
  const setJdExperience = getFilteredTokens(jdData.experience);
  const experienceIntersection = [...setResumeExperience].filter(x => setJdExperience.has(x)).length;
  const experienceUnion = new Set([...setResumeExperience, ...setJdExperience]).size;
  const experienceOverlapScore = experienceUnion === 0 ? 0 : experienceIntersection / experienceUnion;

  // Combined score
  const semanticScore = Math.round(
    (skillOverlapScore * 0.60 +
     projectOverlapScore * 0.20 +
     experienceOverlapScore * 0.20) * 100
  );

  return {
    semanticScore,
    embeddingDebug: {
      similarityMethod: "structured_jaccard",
      skillOverlapScore,
      projectOverlapScore,
      experienceOverlapScore
    }
  };
};