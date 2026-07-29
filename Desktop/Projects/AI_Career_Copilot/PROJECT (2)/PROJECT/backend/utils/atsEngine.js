import { matchResumeWithJD } from "./matchEngine.js";
import { extractStructuredData, fallbackExtract } from "./extractionService.js";
import { classifyDomain } from "./domainClassifier.js";
import { getSemanticSimilarityScore } from "./embeddingService.js";
import { normalizeSkill, uniqNormalized } from "./atsNormalizer.js";

const isTechDomain = (d) => {
  const s = ` ${String(d || "").toLowerCase().trim()} `;
  return TECH_DOMAIN_KEYWORDS.some(k => s.includes(k));
};

const TECH_DOMAIN_KEYWORDS = [
  "software", "machine learning", "data scien", "data analytic", "cybersecurity",
  "cloud", "product management", "business analysis", "artificial intelligence",
  "generative ai", "ai engineering", "ml engineering", "deep learning",
  "natural language", " nlp", "computer vision", "ai/ml", "llm", " ai "
];

const isCoreEngineeringDomain = (d) => [
  "mechanical engineering", "civil engineering", "electrical engineering",
  "electronics engineering", "manufacturing engineering", "industrial engineering"
].includes(String(d || "").toLowerCase().trim());

const checkMajorDomainMismatch = (rDomain, jDomain) => {
  const rd = String(rDomain || "").toLowerCase().trim();
  const jd = String(jDomain || "").toLowerCase().trim();
  
  if (rd === jd || rd === "" || jd === "") return false;
  if (rd === "other" || jd === "other") return false;
  
  // Tech group
  const isTechR = isTechDomain(rd);
  const isTechJ = isTechDomain(jd);
  
  // Core Engineering group
  const isEngR = isCoreEngineeringDomain(rd);
  const isEngJ = isCoreEngineeringDomain(jd);
  
  // If both are tech, it's not a major mismatch
  if (isTechR && isTechJ) return false;
  
  // If both are core engineering, it's adjacent but distinct
  if (isEngR && isEngJ) return true;
  
  // If they are in different macro categories, it's a major mismatch
  return true;
};

const uniq = (arr) => [...new Set(arr.map(x => String(x).trim()).filter(Boolean))];

const pickDomainWeight = (domainResumeObj, domainJDObj) => {
  if (!domainResumeObj || !domainJDObj) return 0.5;
  const domainResume = String(domainResumeObj.domain || "").toLowerCase().trim();
  const domainJD = String(domainJDObj.domain || "").toLowerCase().trim();
  
  if (domainResume === domainJD && domainResume !== "") {
    return 1.0;
  }
  return 0.6;
};

const skillImportance = (skill) => {
  const s = normalizeSkill(skill);

  // Weight dictionary for critical skills
  const critical = [
    "python", "machine learning", "tensorflow", "pytorch", "sql", "nlp", "computer vision", "llm",
    "seo", "digital marketing", "social media marketing", "content creation", "branding",
    "campaign management", "lead generation", "google analytics"
  ];

  const important = ["analytics", "communication", "excel", "tableau", "power bi", "aws", "docker", "kubernetes"];

  if (critical.some(c => s === c)) return 5;
  if (important.some(c => s === c)) return 3;
  return 1;
};

const scoreSkills = ({ resumeSkills, jdSkills }) => {
  const canonicalResumeSkills = uniqNormalized(resumeSkills);
  const canonicalJDSkills = uniqNormalized(jdSkills);

  const resumeSet = new Set(canonicalResumeSkills);
  const matched = [];
  const missing = [];
  let matchedWeight = 0;
  let totalWeight = 0;

  for (const jdSkill of canonicalJDSkills) {
    const weight = skillImportance(jdSkill);
    totalWeight += weight;

    // Direct comparison using centralized normalized form
    const covered = jdSkill && [...resumeSet].some(rs => rs === jdSkill || rs.includes(jdSkill) || jdSkill.includes(rs));

    if (covered) {
      matched.push(jdSkill);
      matchedWeight += weight;
    } else {
      missing.push(jdSkill);
    }
  }

  const skillScore = totalWeight ? matchedWeight / totalWeight : 0;
  return { 
    skillScore, 
    matchedSkills: uniq(matched), 
    missingSkills: uniq(missing), 
    weightBreakdown: { matchedWeight, totalWeight } 
  };
};

const buildUnifiedSkillPool = (data) => {
  if (!data) return [];
  const combined = [
    ...(data.skills || []),
    ...(data.tools || []),
    ...(data.technologies || []),
    ...(data.frameworks || []),
    ...(data.softSkills || [])
  ];
  return uniqNormalized(combined);
};

export const matchResumeWithJD_ATS = async ({ resumeText, resumeSkills = [], jobDescription }) => {
  const debug = {};

  // Structured extraction (Ph1)
  const resumeParseStart = Date.now();
  const extractedResumeData = await extractStructuredData({ text: resumeText, kind: "resume" });
  const resumeParseTime = Date.now() - resumeParseStart;
  console.log(`[STEP 2] Resume parsed (${resumeParseTime}ms)`);

  const jdParseStart = Date.now();
  const extractedJDData = await extractStructuredData({ text: jobDescription, kind: "jd" });
  const jdParseTime = Date.now() - jdParseStart;
  console.log(`[STEP 3] JD extracted (${jdParseTime}ms)`);

  debug.extractedResumeData = extractedResumeData;
  debug.extractedJDData = extractedJDData;

  // Domain classification & Structured semantic similarity (Ph2+Ph3) in parallel
  const embeddingStart = Date.now();
  const [domainResume, domainJD, semanticResult] = await Promise.all([
    classifyDomain({ text: resumeText, hint: "resume" }),
    classifyDomain({ text: jobDescription, hint: "jd" }),
    getSemanticSimilarityScore({
      resumeText,
      jdText: jobDescription,
      extractedResumeData,
      extractedJDData
    }).catch(err => {
      console.warn("⚠️ Semantic similarity score failed, using fallback:", err.message);
      return { semanticScore: 50, embeddingDebug: { error: err.message } };
    })
  ]);
  const embeddingTime = Date.now() - embeddingStart;
  console.log(`[STEP 4] Embeddings generated (${embeddingTime}ms)`);

  debug.domainDetection = { domainResume, domainJD };
  
  const semanticScore = semanticResult.semanticScore;
  const embeddingDebug = semanticResult.embeddingDebug;
  debug.embeddingSimilarity = embeddingDebug;

  const atsScoreStart = Date.now();

  // Skills (Ph4)
  const fallbackResume = fallbackExtract(resumeText);
  const fallbackJD = fallbackExtract(jobDescription);

  const resumeSkillsList = extractedResumeData.skills && extractedResumeData.skills.length > 0 
    ? extractedResumeData.skills 
    : fallbackResume.skills;

  const resumeUnifiedPool = buildUnifiedSkillPool({
    skills: [...resumeSkillsList, ...(resumeSkills || [])],
    tools: extractedResumeData.tools,
    technologies: extractedResumeData.technologies,
    frameworks: extractedResumeData.frameworks,
    softSkills: extractedResumeData.softSkills
  });

  const jdSkillsList = extractedJDData.skills && extractedJDData.skills.length > 0 
    ? extractedJDData.skills 
    : fallbackJD.skills;

  const jdUnifiedPool = buildUnifiedSkillPool({
    skills: jdSkillsList,
    tools: extractedJDData.tools,
    technologies: extractedJDData.technologies,
    frameworks: extractedJDData.frameworks,
    softSkills: extractedJDData.softSkills
  });

  // Determine domain match
  const domainMatch = pickDomainWeight(domainResume, domainJD);

  const skillRes = scoreSkills({ resumeSkills: resumeUnifiedPool, jdSkills: jdUnifiedPool });
  const skillScore = Math.round(skillRes.skillScore * 100);

  // Experience/Education/Certifications (Ph5-7)
  const experienceScore = extractedJDData.experience?.length
    ? Math.min(100, Math.round((resumeUnifiedPool.length > 0 ? 70 : 30) * 0.9 + (extractedResumeData.experience?.length ? 30 : 0)))
    : 50;

  const educationScore = extractedJDData.education?.length
    ? (extractedResumeData.education?.length ? 85 : 45)
    : 50;

  const certificationScore = extractedJDData.certifications?.length
    ? (extractedResumeData.certifications?.length ? 80 : 40)
    : 50;

  const finalScore = Math.round(
    0.40 * (skillScore) +
    0.30 * (semanticScore) * domainMatch +
    0.15 * (experienceScore) +
    0.10 * (educationScore) +
    0.05 * (certificationScore)
  );

  const atsScoreTime = Date.now() - atsScoreStart;
  console.log(`[STEP 5] ATS Score calculated (${atsScoreTime}ms)`);

  const matchedSkills = skillRes.matchedSkills;
  const missingSkills = skillRes.missingSkills;

  const isMismatch = checkMajorDomainMismatch(domainResume?.domain, domainJD?.domain);
  let matchScoreVal = finalScore;

  let strengths = [
    ...(matchedSkills.slice(0, 3).map(s => `Strong in ${s}`))
  ];

  let weaknesses = [
    ...(missingSkills.slice(0, 3).map(s => `Missing or weak: ${s}`))
  ];

  let improvementSuggestions = [
    ...(missingSkills.slice(0, 5).map(s => `Improve by adding evidence for ${s} (projects/metrics/portfolio).`))
  ];

  let primaryReason = null;
  let aiRecommendation = null;

  if (isMismatch) {
    // Cap score between 5% and 20%
    matchScoreVal = Math.max(5, Math.min(20, Math.round(finalScore * 0.2)));
    
    primaryReason = `The candidate's experience is in ${domainResume.domain || "a different domain"}, while the job requires ${domainJD.domain || "a different"} expertise.`;
    aiRecommendation = `Consider applying to ${domainResume.domain || "related"} roles or acquire the required ${domainJD.domain || "target"} skills before applying.`;
    
    strengths = [];
    weaknesses = [
      `Domain mismatch detected: Resume belongs to ${domainResume.domain || "a different domain"} while job requires ${domainJD.domain || "target domain"} skills.`
    ];
    improvementSuggestions = [
      `Target roles matching your ${domainResume.domain || "background"} background.`,
      `Acquire foundational skills in ${domainJD.domain || "target domain"} before applying.`
    ];
  }

  debug.skillWeightBreakdown = skillRes.weightBreakdown;

  const scoreBreakdown = {
    finalScore: matchScoreVal,
    skillScore,
    semanticScore,
    experienceScore,
    educationScore,
    certificationScore,
    domainMatch
  };

  // Phase 7 - Print Debug Logs
  console.log("[DOMAIN DETECTION]", { domainResume: domainResume.domain, domainJD: domainJD.domain });
  console.log("Extracted Resume Skills:");
  console.log(JSON.stringify(resumeUnifiedPool, null, 2));
  console.log("Extracted JD Skills:");
  console.log(JSON.stringify(jdUnifiedPool, null, 2));
  console.log("[MATCHED SKILLS]", matchedSkills);
  console.log("[MISSING SKILLS]", missingSkills);
  console.log("[SKILL SCORE]", skillScore);
  console.log("[SEMANTIC SCORE]", semanticScore);
  console.log("[EXPERIENCE SCORE]", experienceScore);
  console.log("[EDUCATION SCORE]", educationScore);
  console.log("[CERTIFICATION SCORE]", certificationScore);
  console.log("[DOMAIN MATCH]", domainMatch);
  console.log("[FINAL SCORE]", matchScoreVal);

  debug.scoreBreakdown = scoreBreakdown;

  // Fallback layer for explainability resilience
  const legacy = matchResumeWithJD(resumeUnifiedPool, jobDescription);

  return {
    finalScore: Math.max(0, Math.min(100, matchScoreVal)),
    semanticScore,
    skillScore,
    experienceScore,
    educationScore,
    certificationScore,
    domainMatch,
    matchedSkills,
    missingSkills,
    resumeSkills: resumeUnifiedPool,
    jdSkills: jdUnifiedPool,
    strengths,
    weaknesses,
    improvementSuggestions,
    domainResume: domainResume?.domain || "Other",
    domainJD: domainJD?.domain || "Other",
    isDomainMismatch: isMismatch,
    primaryReason,
    aiRecommendation,
    debug: {
      ...debug,
      legacyFallback: {
        matchScore: legacy.matchScore,
        matchedSkills: legacy.matchedSkills,
        missingSkills: legacy.missingSkills
      }
    }
  };
};

export const matchResumeWithJD_ATS_Reuse = async ({
  resumeText,
  jobDescription,
  baselineData // { extractedResumeData, extractedJDData, domainResume, domainJD }
}) => {
  const { extractedResumeData, extractedJDData, domainResume, domainJD } = baselineData;
  const debug = {};

  debug.extractedResumeData = extractedResumeData;
  debug.extractedJDData = extractedJDData;
  debug.domainDetection = { domainResume, domainJD };

  // Re-generate semantic similarity since resumeText changed
  const semanticResult = await getSemanticSimilarityScore({
    resumeText,
    jdText: jobDescription,
    extractedResumeData,
    extractedJDData
  }).catch(err => {
    console.warn("⚠️ Semantic similarity score failed, using fallback:", err.message);
    return { semanticScore: 50, embeddingDebug: { error: err.message } };
  });

  const semanticScore = semanticResult.semanticScore;
  debug.embeddingSimilarity = semanticResult.embeddingDebug;

  // Reconstruct unified skill pool from baseline extraction
  const resumeSkillsList = extractedResumeData.skills || [];
  const resumeUnifiedPool = buildUnifiedSkillPool({
    skills: resumeSkillsList,
    tools: extractedResumeData.tools,
    technologies: extractedResumeData.technologies,
    frameworks: extractedResumeData.frameworks,
    softSkills: extractedResumeData.softSkills
  });

  const jdSkillsList = extractedJDData.skills || [];
  const jdUnifiedPool = buildUnifiedSkillPool({
    skills: jdSkillsList,
    tools: extractedJDData.tools,
    technologies: extractedJDData.technologies,
    frameworks: extractedJDData.frameworks,
    softSkills: extractedJDData.softSkills
  });

  // ── FIX: detect JD keywords that were newly woven into the tailored text ──
  // Without this, skillScore/matchedSkills are frozen from the baseline extraction
  // forever, so tailored text changes are invisible to the scorer.
  const normalizeForSearch = (s) =>
    String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normalizedResumeText = normalizeForSearch(resumeText);

  for (const jdSkill of jdUnifiedPool) {
    if (
      !resumeUnifiedPool.includes(jdSkill) &&
      normalizedResumeText.includes(normalizeForSearch(jdSkill))
    ) {
      resumeUnifiedPool.push(jdSkill);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const domainMatch = pickDomainWeight(domainResume, domainJD);
  const skillRes = scoreSkills({ resumeSkills: resumeUnifiedPool, jdSkills: jdUnifiedPool });
  const skillScore = Math.round(skillRes.skillScore * 100);

  const experienceScore = extractedJDData.experience?.length
    ? Math.min(100, Math.round((resumeUnifiedPool.length > 0 ? 70 : 30) * 0.9 + (extractedResumeData.experience?.length ? 30 : 0)))
    : 50;

  const educationScore = extractedJDData.education?.length
    ? (extractedResumeData.education?.length ? 85 : 45)
    : 50;

  const certificationScore = extractedJDData.certifications?.length
    ? (extractedResumeData.certifications?.length ? 80 : 40)
    : 50;

  const finalScore = Math.round(
    0.40 * (skillScore) +
    0.30 * (semanticScore) * domainMatch +
    0.15 * (experienceScore) +
    0.10 * (educationScore) +
    0.05 * (certificationScore)
  );

  const matchedSkills = skillRes.matchedSkills;
  const missingSkills = skillRes.missingSkills;
  const isMismatch = checkMajorDomainMismatch(domainResume?.domain, domainJD?.domain);
  let matchScoreVal = finalScore;

  if (isMismatch) {
    matchScoreVal = Math.max(5, Math.min(20, Math.round(finalScore * 0.2)));
  }

  debug.skillWeightBreakdown = skillRes.weightBreakdown;

  const scoreBreakdown = {
    finalScore: matchScoreVal,
    skillScore,
    semanticScore,
    experienceScore,
    educationScore,
    certificationScore,
    domainMatch
  };
  debug.scoreBreakdown = scoreBreakdown;

  const legacy = matchResumeWithJD(resumeUnifiedPool, jobDescription);

  return {
    finalScore: Math.max(0, Math.min(100, matchScoreVal)),
    semanticScore,
    skillScore,
    experienceScore,
    educationScore,
    certificationScore,
    domainMatch,
    matchedSkills,
    missingSkills,
    resumeSkills: resumeUnifiedPool,
    jdSkills: jdUnifiedPool,
    domainResume: domainResume?.domain || "Other",
    domainJD: domainJD?.domain || "Other",
    isDomainMismatch: isMismatch,
    debug: {
      ...debug,
      legacyFallback: {
        matchScore: legacy.matchScore,
        matchedSkills: legacy.matchedSkills,
        missingSkills: legacy.missingSkills
      }
    }
  };
};
