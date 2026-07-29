import { cacheGet, cacheSet, sha256, CACHE_VERSION } from "./cacheService.js";
import { generateContentWithAI } from "./geminiClient.js";
import { normalizeSkill } from "./atsNormalizer.js";

const EXTRACTOR_VERSION = "ext-v2";

const uniq = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))];
};

export const fallbackExtract = () => ({
  skills:        [],
  tools:         [],
  technologies:  [],
  frameworks:    [],
  education:     [],
  certifications:[],
  projects:      [],
  experience:    [],
  softSkills:    [],
  jobTitles:     [],
  domain:        ""
});

export const extractStructuredData = async ({ text, kind }) => {
  const cacheKey = sha256(`${CACHE_VERSION}:${EXTRACTOR_VERSION}:${kind}:${text}`);
  const cached = cacheGet("structuredExtraction", cacheKey);
  if (cached) return cached;

  const hasAPIKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!hasAPIKey) {
    const fb = fallbackExtract();
    console.log(`[EXTRACT ${kind.toUpperCase()}] No API key — empty extraction`);
    cacheSet("structuredExtraction", cacheKey, fb);
    return fb;
  }

  const payload = String(text || "").slice(0, 6000);

  const prompt = `You are a precise ATS data extractor. Extract structured information from the ${kind === "resume" ? "CANDIDATE RESUME" : "JOB DESCRIPTION"} below.

CRITICAL RULES:
1. Extract ONLY information that is explicitly present in the text. Do NOT infer, assume, or hallucinate.
2. Skills, tools, frameworks must be REAL technologies/skills present verbatim or near-verbatim in the text.
3. jobTitles: extract exact job titles, role names, or target role mentioned (e.g., "Frontend Developer", "ML Engineer"). For a JD, this is the position title.
4. experience: extract role titles with company/team context (e.g., "Frontend Developer at XYZ Corp").
5. softSkills: only explicit non-technical skills (e.g., "communication", "leadership").
6. If a field has no clear evidence in the text, return an empty array [].
7. Normalize skill names (e.g., "ReactJS" → "React", "NodeJS" → "Node.js").

Return ONLY valid JSON with no markdown, no explanation:
{
  "skills": [],
  "tools": [],
  "technologies": [],
  "frameworks": [],
  "education": [],
  "certifications": [],
  "projects": [],
  "experience": [],
  "softSkills": [],
  "jobTitles": [],
  "domain": ""
}

--- ${kind === "resume" ? "RESUME" : "JOB DESCRIPTION"} TEXT ---
${payload}
--- END ---`;

  try {
    const rawContent = await generateContentWithAI(prompt, "meta-llama/llama-3.3-70b-instruct:free");

    console.log(`[EXTRACT ${kind.toUpperCase()}] Raw LLM response (first 300 chars):`, rawContent.slice(0, 300));

    const raw = rawContent.replace(/```json|```/gi, "").trim();

    // Extract JSON object from response
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found in extraction response");

    const parsed = JSON.parse(raw.substring(start, end + 1));

    const response = {
      ...fallbackExtract(),
      ...parsed,
      skills:        uniq(parsed.skills        || []).map(normalizeSkill),
      tools:         uniq(parsed.tools         || []),
      technologies:  uniq(parsed.technologies  || []),
      frameworks:    uniq(parsed.frameworks     || []),
      education:     uniq(parsed.education     || []),
      certifications:uniq(parsed.certifications|| []),
      projects:      uniq(parsed.projects      || []),
      experience:    uniq(parsed.experience    || []),
      softSkills:    uniq(parsed.softSkills    || []),
      jobTitles:     uniq(parsed.jobTitles     || []),
      domain:        parsed.domain || ""
    };

    console.log(`[EXTRACT ${kind.toUpperCase()}] skills:`, response.skills);
    console.log(`[EXTRACT ${kind.toUpperCase()}] jobTitles:`, response.jobTitles);
    console.log(`[EXTRACT ${kind.toUpperCase()}] tools:`, response.tools);
    console.log(`[EXTRACT ${kind.toUpperCase()}] technologies:`, response.technologies);
    console.log(`[EXTRACT ${kind.toUpperCase()}] frameworks:`, response.frameworks);

    cacheSet("structuredExtraction", cacheKey, response);
    return response;
  } catch (err) {
    console.warn(`[EXTRACT ${kind.toUpperCase()} FALLBACK]`, err?.message);
    const fallback = fallbackExtract();
    cacheSet("structuredExtraction", cacheKey, fallback);
    return fallback;
  }
};