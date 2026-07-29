/**
 * domainClassifier.js — Evidence-First Domain Classification
 *
 * Architecture:
 *   Structured Evidence → Rule-Based Scoring → AI Validation → Cross-Validation → Final Domain
 *
 * The AI validates the rule-based candidate — it does NOT guess from scratch.
 * This prevents hallucination. Every prediction is traceable to concrete evidence.
 */

import { cacheGet, cacheSet, sha256, CACHE_VERSION } from "./cacheService.js";
import { generateContentWithAI } from "./geminiClient.js";

// ============================================================
// VERSIONING — increment when taxonomy/fingerprints change
// to automatically invalidate cached results.
// ============================================================
export const TAXONOMY_VERSION = "tax-v2";
export const ENGINE_VERSION  = "eng-v2";

// ============================================================
// CONTROLLED TAXONOMY (27 labels + Unknown)
// Only these labels are allowed. No free-form domains.
// ============================================================
export const DOMAIN_TAXONOMY = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Generative AI Engineering",
  "Machine Learning",
  "Data Science",
  "Data Analytics",
  "Mobile Development",
  "DevOps",
  "Cloud Engineering",
  "Cybersecurity",
  "UI/UX Design",
  "Software Engineering",
  "Product Management",
  "Business Analysis",
  "Marketing",
  "Sales",
  "Finance",
  "HR",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics Engineering",
  "Manufacturing Engineering",
  "Industrial Engineering",
  "Unknown"
];

// ============================================================
// DOMAIN FINGERPRINTS
// core   → high-signal, weighted 3–4 (must have ≥1 for classification)
// supporting → medium-signal, weighted 1–2
// ============================================================
export const DOMAIN_FINGERPRINTS = {
  "Frontend Development": {
    core: [
      { signal: "react",              weight: 4 },
      { signal: "angular",            weight: 4 },
      { signal: "vue",                weight: 4 },
      { signal: "svelte",             weight: 4 },
      { signal: "next.js",            weight: 3 },
      { signal: "nextjs",             weight: 3 },
      { signal: "nuxt",               weight: 3 },
      { signal: "javascript",         weight: 3 },
      { signal: "typescript",         weight: 3 },
      { signal: "html",               weight: 2 },
      { signal: "css",                weight: 2 },
      { signal: "redux",              weight: 2 },
      { signal: "tailwind",           weight: 2 },
      { signal: "frontend developer", weight: 5 },
      { signal: "front-end developer",weight: 5 },
      { signal: "front end developer",weight: 5 },
      { signal: "ui developer",       weight: 4 },
    ],
    supporting: [
      { signal: "webpack",            weight: 2 },
      { signal: "vite",               weight: 2 },
      { signal: "jest",               weight: 1 },
      { signal: "cypress",            weight: 1 },
      { signal: "sass",               weight: 1 },
      { signal: "scss",               weight: 1 },
      { signal: "bootstrap",          weight: 1 },
      { signal: "responsive design",  weight: 1 },
      { signal: "storybook",          weight: 1 },
      { signal: "jsx",                weight: 2 },
      { signal: "tsx",                weight: 2 },
      { signal: "dom",                weight: 1 },
      { signal: "figma",              weight: 1 },
    ]
  },

  "Backend Development": {
    core: [
      { signal: "nodejs",            weight: 4 },
      { signal: "node.js",           weight: 4 },
      { signal: "express",           weight: 3 },
      { signal: "django",            weight: 4 },
      { signal: "flask",             weight: 4 },
      { signal: "fastapi",           weight: 4 },
      { signal: "spring boot",       weight: 4 },
      { signal: "laravel",           weight: 4 },
      { signal: "ruby on rails",     weight: 4 },
      { signal: "rest api",          weight: 3 },
      { signal: "graphql",           weight: 3 },
      { signal: "microservices",     weight: 3 },
      { signal: "backend developer", weight: 5 },
      { signal: "back-end developer",weight: 5 },
    ],
    supporting: [
      { signal: "postgresql",        weight: 2 },
      { signal: "mysql",             weight: 2 },
      { signal: "mongodb",           weight: 2 },
      { signal: "redis",             weight: 2 },
      { signal: "grpc",              weight: 2 },
      { signal: "kafka",             weight: 2 },
      { signal: "rabbitmq",          weight: 2 },
      { signal: "api development",   weight: 2 },
      { signal: "server-side",       weight: 2 },
    ]
  },

  "Full Stack Development": {
    core: [
      { signal: "full stack",             weight: 5 },
      { signal: "fullstack",              weight: 5 },
      { signal: "full-stack developer",   weight: 5 },
      { signal: "full stack developer",   weight: 5 },
      { signal: "mern",                   weight: 5 },
      { signal: "mean",                   weight: 4 },
      { signal: "lamp",                   weight: 3 },
    ],
    supporting: [
      { signal: "react",    weight: 2 },
      { signal: "nodejs",   weight: 2 },
      { signal: "node.js",  weight: 2 },
      { signal: "express",  weight: 1 },
      { signal: "mongodb",  weight: 1 },
    ]
  },

  "Generative AI Engineering": {
    core: [
      { signal: "langchain",                   weight: 5 },
      { signal: "llamaindex",                  weight: 5 },
      { signal: "llama index",                 weight: 5 },
      { signal: "rag",                         weight: 5 },
      { signal: "retrieval augmented generation", weight: 5 },
      { signal: "prompt engineering",          weight: 5 },
      { signal: "llm",                         weight: 4 },
      { signal: "large language model",        weight: 4 },
      { signal: "generative ai",               weight: 5 },
      { signal: "gen ai",                      weight: 4 },
      { signal: "vector database",             weight: 4 },
      { signal: "pinecone",                    weight: 4 },
      { signal: "chromadb",                    weight: 4 },
      { signal: "weaviate",                    weight: 4 },
      { signal: "embeddings",                  weight: 3 },
    ],
    supporting: [
      { signal: "openai",            weight: 3 },
      { signal: "gpt",               weight: 3 },
      { signal: "hugging face",      weight: 2 },
      { signal: "huggingface",       weight: 2 },
      { signal: "transformer",       weight: 2 },
      { signal: "fine-tuning",       weight: 2 },
      { signal: "finetuning",        weight: 2 },
      { signal: "stable diffusion",  weight: 2 },
      { signal: "anthropic",         weight: 2 },
      { signal: "conversational ai", weight: 2 },
      { signal: "semantic search",   weight: 2 },
    ]
  },

  "Machine Learning": {
    core: [
      { signal: "machine learning",         weight: 5 },
      { signal: "deep learning",            weight: 4 },
      { signal: "tensorflow",               weight: 4 },
      { signal: "pytorch",                  weight: 4 },
      { signal: "neural network",           weight: 4 },
      { signal: "scikit-learn",             weight: 4 },
      { signal: "sklearn",                  weight: 3 },
      { signal: "nlp",                      weight: 3 },
      { signal: "natural language processing", weight: 3 },
      { signal: "computer vision",          weight: 3 },
      { signal: "ml engineer",              weight: 5 },
      { signal: "machine learning engineer",weight: 5 },
    ],
    supporting: [
      { signal: "xgboost",              weight: 2 },
      { signal: "gradient boosting",    weight: 2 },
      { signal: "random forest",        weight: 2 },
      { signal: "reinforcement learning", weight: 2 },
      { signal: "mlops",                weight: 2 },
      { signal: "model training",       weight: 2 },
      { signal: "feature engineering",  weight: 2 },
      { signal: "keras",                weight: 2 },
      { signal: "opencv",               weight: 2 },
    ]
  },

  "Data Science": {
    core: [
      { signal: "data scientist",           weight: 5 },
      { signal: "data science",             weight: 5 },
      { signal: "pandas",                   weight: 3 },
      { signal: "numpy",                    weight: 3 },
      { signal: "statistical analysis",     weight: 3 },
      { signal: "hypothesis testing",       weight: 3 },
      { signal: "exploratory data analysis",weight: 3 },
      { signal: "jupyter",                  weight: 2 },
    ],
    supporting: [
      { signal: "matplotlib",           weight: 2 },
      { signal: "seaborn",              weight: 2 },
      { signal: "r language",           weight: 2 },
      { signal: "data visualization",   weight: 2 },
      { signal: "feature engineering",  weight: 2 },
      { signal: "a/b testing",          weight: 2 },
      { signal: "regression",           weight: 1 },
      { signal: "classification",       weight: 1 },
      { signal: "clustering",           weight: 1 },
    ]
  },

  "Data Analytics": {
    core: [
      { signal: "data analyst",          weight: 5 },
      { signal: "data analytics",        weight: 5 },
      { signal: "tableau",               weight: 4 },
      { signal: "power bi",              weight: 4 },
      { signal: "business intelligence", weight: 3 },
      { signal: "looker",                weight: 3 },
      { signal: "google analytics",      weight: 3 },
    ],
    supporting: [
      { signal: "dashboard",       weight: 2 },
      { signal: "reporting",       weight: 2 },
      { signal: "kpi",             weight: 2 },
      { signal: "data warehouse",  weight: 2 },
      { signal: "etl",             weight: 2 },
      { signal: "sql",             weight: 2 },
      { signal: "excel",           weight: 1 },
    ]
  },

  "Mobile Development": {
    core: [
      { signal: "android",          weight: 4 },
      { signal: "ios",              weight: 4 },
      { signal: "react native",     weight: 5 },
      { signal: "flutter",          weight: 5 },
      { signal: "swift",            weight: 4 },
      { signal: "kotlin",           weight: 4 },
      { signal: "mobile developer", weight: 5 },
      { signal: "mobile app",       weight: 4 },
    ],
    supporting: [
      { signal: "dart",            weight: 3 },
      { signal: "xcode",           weight: 2 },
      { signal: "android studio",  weight: 2 },
      { signal: "app store",       weight: 2 },
      { signal: "play store",      weight: 2 },
      { signal: "expo",            weight: 2 },
    ]
  },

  "DevOps": {
    core: [
      { signal: "devops",                weight: 5 },
      { signal: "kubernetes",            weight: 4 },
      { signal: "ci/cd",                 weight: 4 },
      { signal: "jenkins",               weight: 3 },
      { signal: "github actions",        weight: 3 },
      { signal: "terraform",             weight: 4 },
      { signal: "infrastructure as code",weight: 4 },
      { signal: "site reliability",      weight: 4 },
    ],
    supporting: [
      { signal: "docker",       weight: 2 },
      { signal: "ansible",      weight: 2 },
      { signal: "helm",         weight: 2 },
      { signal: "prometheus",   weight: 2 },
      { signal: "grafana",      weight: 2 },
      { signal: "nginx",        weight: 2 },
      { signal: "linux",        weight: 1 },
      { signal: "bash",         weight: 1 },
    ]
  },

  "Cloud Engineering": {
    core: [
      { signal: "aws",                 weight: 4 },
      { signal: "azure",               weight: 4 },
      { signal: "google cloud",        weight: 4 },
      { signal: "gcp",                 weight: 4 },
      { signal: "cloud engineer",      weight: 5 },
      { signal: "cloud architect",     weight: 5 },
      { signal: "cloud infrastructure",weight: 4 },
    ],
    supporting: [
      { signal: "ec2",             weight: 2 },
      { signal: "cloudformation",  weight: 3 },
      { signal: "serverless",      weight: 2 },
      { signal: "eks",             weight: 2 },
    ]
  },

  "Cybersecurity": {
    core: [
      { signal: "cybersecurity",       weight: 5 },
      { signal: "penetration testing", weight: 5 },
      { signal: "ethical hacking",     weight: 5 },
      { signal: "security engineer",   weight: 5 },
      { signal: "soc analyst",         weight: 5 },
      { signal: "network security",    weight: 3 },
    ],
    supporting: [
      { signal: "owasp",        weight: 2 },
      { signal: "vulnerability",weight: 2 },
      { signal: "kali linux",   weight: 2 },
      { signal: "metasploit",   weight: 2 },
      { signal: "wireshark",    weight: 2 },
      { signal: "siem",         weight: 2 },
      { signal: "zero trust",   weight: 2 },
      { signal: "encryption",   weight: 1 },
      { signal: "firewall",     weight: 1 },
    ]
  },

  "UI/UX Design": {
    core: [
      { signal: "ux design",       weight: 5 },
      { signal: "ui design",       weight: 5 },
      { signal: "user experience", weight: 5 },
      { signal: "ux designer",     weight: 5 },
      { signal: "ui designer",     weight: 5 },
      { signal: "wireframe",       weight: 4 },
      { signal: "prototype",       weight: 3 },
      { signal: "figma",           weight: 4 },
      { signal: "user interface",  weight: 3 },
    ],
    supporting: [
      { signal: "sketch",                  weight: 2 },
      { signal: "adobe xd",               weight: 2 },
      { signal: "design system",           weight: 2 },
      { signal: "user research",           weight: 2 },
      { signal: "usability testing",       weight: 2 },
      { signal: "information architecture",weight: 2 },
    ]
  },

  "Software Engineering": {
    core: [
      { signal: "software engineer",    weight: 4 },
      { signal: "software developer",   weight: 4 },
      { signal: "software development", weight: 3 },
      { signal: "design patterns",      weight: 2 },
      { signal: "object oriented",      weight: 2 },
    ],
    supporting: [
      { signal: "agile",          weight: 1 },
      { signal: "scrum",          weight: 1 },
      { signal: "git",            weight: 1 },
      { signal: "code review",    weight: 1 },
      { signal: "algorithm",      weight: 1 },
      { signal: "data structure", weight: 1 },
    ]
  },

  "Product Management": {
    core: [
      { signal: "product manager",    weight: 5 },
      { signal: "product management", weight: 5 },
      { signal: "product roadmap",    weight: 5 },
      { signal: "product strategy",   weight: 4 },
    ],
    supporting: [
      { signal: "user stories",weight: 2 },
      { signal: "stakeholder",  weight: 2 },
      { signal: "jira",         weight: 1 },
      { signal: "confluence",   weight: 1 },
    ]
  },

  "Business Analysis": {
    core: [
      { signal: "business analyst",       weight: 5 },
      { signal: "business analysis",      weight: 5 },
      { signal: "requirements gathering", weight: 4 },
      { signal: "process improvement",    weight: 3 },
    ],
    supporting: [
      { signal: "gap analysis",        weight: 2 },
      { signal: "use case",            weight: 2 },
      { signal: "stakeholder analysis",weight: 2 },
    ]
  },

  "Marketing": {
    core: [
      { signal: "digital marketing",       weight: 5 },
      { signal: "social media marketing",  weight: 5 },
      { signal: "content marketing",       weight: 5 },
      { signal: "marketing manager",       weight: 5 },
      { signal: "seo specialist",          weight: 5 },
      { signal: "google ads",              weight: 4 },
      { signal: "seo",                     weight: 3 },
    ],
    supporting: [
      { signal: "branding",        weight: 2 },
      { signal: "email marketing", weight: 2 },
      { signal: "campaign",        weight: 2 },
      { signal: "copywriting",     weight: 2 },
      { signal: "lead generation", weight: 2 },
    ]
  },

  "Finance": {
    core: [
      { signal: "financial analyst",   weight: 5 },
      { signal: "financial modeling",  weight: 5 },
      { signal: "investment banking",  weight: 5 },
      { signal: "equity research",     weight: 5 },
      { signal: "corporate finance",   weight: 5 },
      { signal: "valuation",           weight: 3 },
      { signal: "cfa",                 weight: 4 },
    ],
    supporting: [
      { signal: "bloomberg",         weight: 2 },
      { signal: "balance sheet",     weight: 2 },
      { signal: "portfolio management",weight: 2 },
      { signal: "risk management",   weight: 2 },
    ]
  },

  "HR": {
    core: [
      { signal: "human resources",    weight: 5 },
      { signal: "hr manager",         weight: 5 },
      { signal: "talent acquisition", weight: 5 },
      { signal: "recruitment",        weight: 4 },
      { signal: "hr business partner",weight: 5 },
    ],
    supporting: [
      { signal: "payroll",              weight: 2 },
      { signal: "employee engagement",  weight: 2 },
      { signal: "performance management",weight: 2 },
      { signal: "onboarding",           weight: 2 },
    ]
  },

  "Mechanical Engineering": {
    core: [
      { signal: "mechanical engineer",    weight: 5 },
      { signal: "mechanical engineering", weight: 5 },
      { signal: "autocad",               weight: 3 },
      { signal: "solidworks",            weight: 5 },
      { signal: "catia",                 weight: 5 },
      { signal: "ansys",                 weight: 5 },
      { signal: "machine design",        weight: 5 },
      { signal: "thermodynamics",        weight: 4 },
      { signal: "fluid mechanics",       weight: 4 },
    ],
    supporting: [
      { signal: "matlab",                 weight: 2 },
      { signal: "fea",                    weight: 2 },
      { signal: "sae baja",               weight: 3 },
      { signal: "product design",         weight: 2 },
      { signal: "manufacturing processes",weight: 2 },
      { signal: "cad design",             weight: 2 },
    ]
  },

  "Civil Engineering": {
    core: [
      { signal: "civil engineer",        weight: 5 },
      { signal: "civil engineering",     weight: 5 },
      { signal: "structural engineering",weight: 5 },
      { signal: "revit",                 weight: 3 },
      { signal: "staad pro",             weight: 5 },
      { signal: "geotechnical",          weight: 5 },
      { signal: "construction management",weight: 5 },
    ],
    supporting: [
      { signal: "surveying",          weight: 2 },
      { signal: "structural analysis",weight: 2 },
    ]
  },

  "Electrical Engineering": {
    core: [
      { signal: "electrical engineer",   weight: 5 },
      { signal: "electrical engineering",weight: 5 },
      { signal: "power systems",         weight: 4 },
      { signal: "circuit design",        weight: 3 },
      { signal: "plc",                   weight: 3 },
      { signal: "scada",                 weight: 3 },
      { signal: "power electronics",     weight: 4 },
      { signal: "transformers",          weight: 3 },
    ],
    supporting: [
      { signal: "hvac",             weight: 2 },
      { signal: "relay protection", weight: 2 },
      { signal: "generators",       weight: 2 },
      { signal: "motors",           weight: 2 },
    ]
  },

  "Electronics Engineering": {
    core: [
      { signal: "electronics engineer",   weight: 5 },
      { signal: "electronics engineering",weight: 5 },
      { signal: "vlsi",                   weight: 5 },
      { signal: "embedded systems",       weight: 5 },
      { signal: "pcb design",             weight: 5 },
      { signal: "microcontroller",        weight: 4 },
      { signal: "fpga",                   weight: 5 },
      { signal: "vhdl",                   weight: 5 },
      { signal: "verilog",                weight: 5 },
    ],
    supporting: [
      { signal: "arduino",          weight: 2 },
      { signal: "raspberry pi",     weight: 2 },
      { signal: "signal processing",weight: 2 },
      { signal: "iot",              weight: 2 },
    ]
  },

  "Manufacturing Engineering": {
    core: [
      { signal: "manufacturing engineer",   weight: 5 },
      { signal: "manufacturing engineering",weight: 5 },
      { signal: "lean manufacturing",       weight: 5 },
      { signal: "six sigma",                weight: 4 },
      { signal: "cnc machining",            weight: 5 },
      { signal: "assembly line",            weight: 4 },
    ],
    supporting: [
      { signal: "production planning",weight: 2 },
      { signal: "quality control",    weight: 2 },
      { signal: "sap",                weight: 2 },
      { signal: "erp",                weight: 2 },
    ]
  },

  "Industrial Engineering": {
    core: [
      { signal: "industrial engineer",   weight: 5 },
      { signal: "industrial engineering",weight: 5 },
      { signal: "supply chain",          weight: 3 },
      { signal: "operations research",   weight: 3 },
      { signal: "logistics",             weight: 3 },
    ],
    supporting: [
      { signal: "inventory management",weight: 2 },
      { signal: "linear programming",  weight: 2 },
      { signal: "simulation",          weight: 2 },
    ]
  },
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalize a single string for signal matching.
 */
const normalizeText = (t) => String(t || "").toLowerCase().trim();

/**
 * Check if an evidence item matches a fingerprint signal.
 * Uses substring match for signals ≥4 chars; requires whole-word for <4 chars.
 */
const matchesSignal = (evidenceItem, signal) => {
  const e = normalizeText(evidenceItem);
  const s = normalizeText(signal);
  if (!e || !s) return false;
  if (e === s) return true;
  // Short signals: word-boundary match to avoid false positives (e.g., "css" in "access")
  if (s.length <= 3) {
    return new RegExp(`(?:^|\\s|[^a-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s|[^a-z0-9])`).test(` ${e} `);
  }
  return e.includes(s) || s.includes(e);
};

/**
 * Build a flat evidence array from structured extracted data.
 * Falls back to raw text tokens if structured data is sparse.
 */
const buildEvidence = (extractedData = {}, rawText = "") => {
  const items = new Set();

  const addArr = (arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach(item => {
      const s = normalizeText(item);
      if (s && s.length > 1) items.add(s);
    });
  };

  addArr(extractedData.skills);
  addArr(extractedData.tools);
  addArr(extractedData.technologies);
  addArr(extractedData.frameworks);
  addArr(extractedData.jobTitles);
  addArr(extractedData.softSkills);
  addArr(extractedData.certifications);

  const addTextTokens = (text) => {
    if (typeof text !== "string") return;
    text.split(/[\s,;|/()[\]{}"']+/).forEach(t => {
      const s = normalizeText(t);
      if (s && s.length >= 3 && s.length <= 40) items.add(s);
    });
  };

  if (extractedData.summary) addTextTokens(extractedData.summary);

  if (Array.isArray(extractedData.experience)) {
    extractedData.experience.forEach(exp => addTextTokens(exp));
  }

  if (Array.isArray(extractedData.projects)) {
    extractedData.projects.forEach(proj => addTextTokens(proj));
  }

  if (rawText) {
    addTextTokens(rawText);
  }

  return [...items].filter(Boolean);
};

// ============================================================
// STAGE 1 — RULE-BASED SCORING
// ============================================================

/**
 * Score each domain by matching evidence against fingerprints.
 * Returns all domains sorted by rawScore descending.
 */
const computeRuleBasedScores = (evidence) => {
  const scores = [];

  for (const [domain, fp] of Object.entries(DOMAIN_FINGERPRINTS)) {
    let coreScore = 0;
    let supportingScore = 0;
    const matchedSignals = [];

    for (const sig of fp.core) {
      if (evidence.some(ev => matchesSignal(ev, sig.signal))) {
        coreScore += sig.weight;
        matchedSignals.push({ signal: sig.signal, weight: sig.weight, type: "core" });
      }
    }
    for (const sig of fp.supporting) {
      if (evidence.some(ev => matchesSignal(ev, sig.signal))) {
        supportingScore += sig.weight;
        matchedSignals.push({ signal: sig.signal, weight: sig.weight, type: "supporting" });
      }
    }

    const rawScore      = coreScore + supportingScore;
    const maxCore       = fp.core.reduce((s, x) => s + x.weight, 0);
    const maxSupporting = fp.supporting.reduce((s, x) => s + x.weight, 0);
    const maxScore      = maxCore + maxSupporting;
    const normalizedScore = maxScore > 0 ? rawScore / maxScore : 0;
    const coreMatchCount  = matchedSignals.filter(m => m.type === "core").length;

    scores.push({
      domain,
      rawScore,
      normalizedScore,
      coreScore,
      supportingScore,
      coreMatchCount,
      matchedSignals,
    });
  }

  return scores.sort((a, b) => b.rawScore - a.rawScore);
};

/**
 * From sorted scores, pick the top candidate domain.
 * Requires at least 1 core signal match.
 */
const getCandidateDomain = (scores) => {
  const top    = scores[0];
  const second = scores[1];

  if (!top || top.rawScore === 0 || top.coreMatchCount === 0) {
    return {
      domain: "Unknown",
      rawScore: 0,
      confidence: 0,
      matchedSignals: [],
      reason: "No core domain signals found in evidence"
    };
  }

  // Confidence from how far ahead the top domain is vs second
  const gap = second
    ? Math.max(0, (top.rawScore - second.rawScore) / Math.max(top.rawScore, 1))
    : 1.0;
  const ruleConfidence = Math.min(top.normalizedScore * 0.7 + gap * 0.3, 1.0);

  return {
    domain:          top.domain,
    rawScore:        top.rawScore,
    normalizedScore: top.normalizedScore,
    confidence:      Math.round(ruleConfidence * 100) / 100,
    coreMatchCount:  top.coreMatchCount,
    matchedSignals:  top.matchedSignals,
    allScores:       scores,
    reason: `Matched ${top.matchedSignals.length} signals (${top.coreMatchCount} core, ${top.matchedSignals.length - top.coreMatchCount} supporting). Score: ${top.rawScore}`
  };
};

// ============================================================
// STAGE 2 — CROSS-VALIDATION
// Check: does the predicted domain's core fingerprint actually
// appear in the evidence?
// ============================================================
const crossValidate = (domain, evidence) => {
  if (domain === "Unknown") return { valid: true, reason: "No validation needed for Unknown" };

  const fp = DOMAIN_FINGERPRINTS[domain];
  if (!fp) return { valid: true, reason: "No fingerprint — skipped" };

  const coreMatches = fp.core.filter(sig =>
    evidence.some(ev => matchesSignal(ev, sig.signal))
  );

  if (coreMatches.length === 0) {
    return {
      valid: false,
      reason: `FAIL: Domain "${domain}" has 0 core signal matches. Evidence: [${evidence.slice(0, 6).join(", ")}]`
    };
  }

  return {
    valid: true,
    reason: `PASS: ${coreMatches.length} core signal(s) confirmed — ${coreMatches.map(m => m.signal).join(", ")}`
  };
};

// ============================================================
// STAGE 3 — AI VALIDATION
// AI confirms or corrects the rule-based candidate.
// It does NOT classify from scratch — it validates evidence.
// ============================================================
const validateWithAI = async (candidateDomain, evidence, allScores) => {
  const hasAPIKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  if (!hasAPIKey) return null;

  const top3 = (allScores || []).slice(0, 3).map(s =>
    `  ${s.domain}: score=${s.rawScore} matched=[${s.matchedSignals.slice(0, 4).map(m => m.signal).join(", ")}]`
  ).join("\n");

  const evidenceStr = evidence.slice(0, 30).join(", ");

  const prompt = `You are a domain classification validator. Your ONLY job is to confirm or correct a rule-based classification.

EXTRACTED EVIDENCE FROM DOCUMENT:
${evidenceStr}

RULE-BASED SCORES (top 3):
${top3}

RULE-BASED CANDIDATE DOMAIN: "${candidateDomain}"

Your task: Verify whether "${candidateDomain}" is correct given the evidence above.

ALLOWED TAXONOMY: ${DOMAIN_TAXONOMY.filter(d => d !== "Unknown").join(", ")}

RULES:
1. If the evidence clearly supports "${candidateDomain}", set confirmed=true and return it.
2. Only change the domain if another taxonomy label is CLEARLY better supported by the evidence.
3. NEVER invent a domain not in the taxonomy.
4. Return "Unknown" ONLY if you cannot determine any domain with confidence >= 0.65.
5. The evidence is the GROUND TRUTH. If evidence says React/TypeScript/NextJS → it's "Frontend Development", period.

Return ONLY valid JSON (no markdown):
{
  "confirmed": true,
  "domain": "${candidateDomain}",
  "confidence": 0.95,
  "reason": "Short explanation"
}`;

  try {
    const rawContent = await generateContentWithAI(prompt, "meta-llama/llama-3.3-70b-instruct:free");
    const raw = rawContent.replace(/```json|```/gi, "").trim();

    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object in AI response");

    const parsed = JSON.parse(raw.substring(start, end + 1));

    const domain     = DOMAIN_TAXONOMY.includes(parsed.domain) ? parsed.domain : candidateDomain;
    const confidence = typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.8;

    return { domain, confidence, confirmed: parsed.confirmed === true, reason: parsed.reason || "" };
  } catch (err) {
    console.warn("  [AI VALIDATION ERROR]", err.message);
    return null;
  }
};

// ============================================================
// COMPOSITE CONFIDENCE CALCULATOR
// ============================================================
const computeCompositeConfidence = (ruleConfidence, aiResult) => {
  if (!aiResult) return ruleConfidence * 0.85; // Unvalidated penalty
  const RULE_WEIGHT = 0.55;
  const AI_WEIGHT   = 0.45;
  return Math.round((RULE_WEIGHT * ruleConfidence + AI_WEIGHT * aiResult.confidence) * 100) / 100;
};

// ============================================================
// MAIN EXPORT — classifyDomain
// ============================================================
export const classifyDomain = async ({ extractedData = {}, rawText = "", hint = "" }) => {
  // ── Build Evidence ──────────────────────────────────────
  const evidence = buildEvidence(extractedData, rawText);

  // ── Cache Lookup ─────────────────────────────────────────
  const evidenceHash = sha256(evidence.slice(0, 50).join(",").toLowerCase());
  const cacheKey = sha256(`${CACHE_VERSION}:${TAXONOMY_VERSION}:${ENGINE_VERSION}:${hint}:${evidenceHash}`);

  const cached = cacheGet("domainClassification", cacheKey);
  if (cached) {
    console.log(`  [DOMAIN CACHE HIT] hint="${hint}" → domain="${cached.domain}" (confidence=${cached.confidence})`);
    return cached;
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  DOMAIN CLASSIFICATION — hint="${hint}"`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  [STAGE 0] Evidence (${evidence.length} items):\n[${evidence.join(", ")}]`);

  // ── STAGE 1: Rule-Based Scoring ──────────────────────────
  const scores   = computeRuleBasedScores(evidence);
  const top3     = scores.slice(0, 3);
  console.log("  [STAGE 1] Rule-Based Scores (top 3):");
  top3.forEach(s => {
    const signalNames = s.matchedSignals.slice(0, 5).map(m => m.signal).join(", ");
    console.log(`    ${s.domain}: score=${s.rawScore} coreMatches=${s.coreMatchCount} signals=[${signalNames}]`);
  });

  const candidate = getCandidateDomain(scores);
  console.log(`  [STAGE 1] Candidate: "${candidate.domain}" — ${candidate.reason}`);

  // ── STAGE 2: Cross-Validation ────────────────────────────
  const crossValResult = crossValidate(candidate.domain, evidence);
  console.log(`  [STAGE 2] Cross-Validation: ${crossValResult.valid ? "✅ PASS" : "❌ FAIL"} — ${crossValResult.reason}`);

  if (!crossValResult.valid) {
    const result = buildResult("Unknown", 0, candidate, null, "rule-based (cross-validation failed)", crossValResult.reason, evidence);
    console.log(`  [FINAL] ❌ "Unknown" — cross-validation rejected "${candidate.domain}"`);
    cacheSet("domainClassification", cacheKey, result);
    return result;
  }

  if (candidate.domain === "Unknown") {
    const result = buildResult("Unknown", 0, candidate, null, "rule-based", candidate.reason, evidence);
    console.log(`  [FINAL] "Unknown" — insufficient evidence`);
    cacheSet("domainClassification", cacheKey, result);
    return result;
  }

  // ── STAGE 3: AI Validation ───────────────────────────────
  console.log(`  [STAGE 3] Validating "${candidate.domain}" with AI...`);
  const aiResult = await validateWithAI(candidate.domain, evidence, scores);

  let finalDomain     = candidate.domain;
  let finalConfidence = computeCompositeConfidence(candidate.confidence, aiResult);

  if (aiResult) {
    console.log(`  [STAGE 3] AI result: domain="${aiResult.domain}" confidence=${aiResult.confidence} confirmed=${aiResult.confirmed}`);

    if (aiResult.domain !== candidate.domain && aiResult.domain !== "Unknown") {
      // AI proposed a different domain — cross-validate AI's suggestion too
      const aiCrossVal = crossValidate(aiResult.domain, evidence);
      console.log(`  [STAGE 3] AI proposed "${aiResult.domain}" → cross-val: ${aiCrossVal.valid ? "PASS" : "FAIL"}`);

      if (aiCrossVal.valid) {
        finalDomain     = aiResult.domain;
        finalConfidence = computeCompositeConfidence(candidate.confidence, aiResult);
      } else {
        // AI's suggestion doesn't pass evidence check — stick with rule-based
        finalDomain     = candidate.domain;
        finalConfidence = candidate.confidence * 0.9;
        console.log(`  [STAGE 3] AI override rejected (no core evidence). Keeping rule-based "${candidate.domain}"`);
      }
    } else if (aiResult.domain === "Unknown" && aiResult.confidence < 0.65) {
      finalDomain     = "Unknown";
      finalConfidence = aiResult.confidence;
    }
  } else {
    console.log("  [STAGE 3] AI unavailable — using rule-based result");
  }

  // ── Confidence threshold ──────────────────────────────────
  if (finalConfidence < 0.28 && finalDomain !== "Unknown") {
    console.log(`  [STAGE 4] Confidence ${finalConfidence} below threshold — downgrading to "Unknown"`);
    finalDomain = "Unknown";
  }

  const result = buildResult(
    finalDomain,
    Math.min(1, Math.max(0, finalConfidence)),
    candidate,
    aiResult,
    aiResult ? "rule-based + ai-validated" : "rule-based",
    candidate.reason,
    evidence
  );

  console.log(`  [FINAL] ✅ domain="${result.domain}" confidence=${result.confidence}`);
  console.log(`  [FINAL] matchedSignals=[${result.matchedSignals.join(", ")}]`);
  console.log(`${"═".repeat(60)}\n`);

  cacheSet("domainClassification", cacheKey, result);
  return result;
};

/** Helper to assemble the result object consistently */
const buildResult = (domain, confidence, candidate, aiResult, source, reason, evidence) => ({
  domain,
  confidence: Math.round(confidence * 100) / 100,
  ruleScore:  candidate?.rawScore || 0,
  matchedSignals: (candidate?.matchedSignals || []).slice(0, 8).map(m => m.signal),
  evidence:   evidence.slice(0, 10),
  aiValidated: aiResult !== null && aiResult !== undefined,
  aiAgreed:   aiResult ? (aiResult.domain === domain) : null,
  source,
  reason,
  confidenceBreakdown: {
    ruleConfidence: candidate?.confidence ?? 0,
    aiConfidence:   aiResult?.confidence ?? null,
  }
});