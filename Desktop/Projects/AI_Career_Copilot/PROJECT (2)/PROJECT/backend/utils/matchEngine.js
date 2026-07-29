// ─── SKILL SYNONYMS & MAPPINGS ───────────────────────────────────────────────
const SKILL_SYNONYMS = {
  "git": ["git", "github", "version control", "source control"],
  "github": ["git", "github", "version control", "source control"],
  "version control": ["git", "github", "version control", "source control"],
  
  "node": ["node", "node.js", "nodejs"],
  "node.js": ["node", "node.js", "nodejs"],
  "nodejs": ["node", "node.js", "nodejs"],
  
  "react": ["react", "reactjs"],
  "reactjs": ["react", "reactjs"],
  
  "ci/cd": ["ci/cd", "continuous integration", "continuous deployment", "devops", "pipeline"],
  "devops": ["ci/cd", "continuous integration", "continuous deployment", "devops", "pipeline"],
  "continuous integration": ["ci/cd", "continuous integration", "continuous deployment", "devops"],
  
  "machine learning": ["machine learning", "ml", "ai", "artificial intelligence"],
  "ml": ["machine learning", "ml", "ai", "artificial intelligence"],
  "ai": ["machine learning", "ml", "ai", "artificial intelligence"],
  
  "system design": ["system design", "architecture", "scalability"],
  "architecture": ["system design", "architecture", "scalability"],
  
  "rest api": ["rest", "rest api", "api", "http"],
  "api": ["rest", "rest api", "api", "http"],
  
  "docker": ["docker", "containerization", "containers"],
  "kubernetes": ["kubernetes", "k8s", "orchestration"],
  "k8s": ["kubernetes", "k8s", "orchestration"],
  
  "mongodb": ["mongodb", "nosql", "database"],
  "mysql": ["mysql", "sql", "database", "relational"],
  "postgresql": ["postgresql", "postgres", "sql", "database", "relational"],
  "sql": ["sql", "mysql", "postgresql", "database", "relational"],
  
  "typescript": ["typescript", "ts", "javascript"],
  "javascript": ["javascript", "js", "typescript"],
  "python": ["python", "python3"],
  "java": ["java"],
  
  "tensorflow": ["tensorflow", "tf", "deep learning", "ml"],
  "pytorch": ["pytorch", "deep learning", "ml"],
  "pandas": ["pandas", "data analysis", "data science"],
  "numpy": ["numpy", "data science", "scientific computing"],
  
  "aws": ["aws", "amazon", "cloud"],
  "azure": ["azure", "microsoft", "cloud"],
  "gcp": ["gcp", "google cloud", "cloud"],
};

// ─── SKILL WEIGHTS ────────────────────────────────────────────────────────────
const SKILL_WEIGHTS = {
  "python": 3,
  "java": 3,
  "javascript": 3,
  "typescript": 3,
  "c++": 2,
  "golang": 2,
  
  "react": 3,
  "node": 3,
  "node.js": 3,
  "django": 2,
  "spring boot": 2,
  
  "machine learning": 3,
  "deep learning": 3,
  "tensorflow": 2,
  "pytorch": 2,
  "ai": 2,
  
  "mongodb": 2,
  "sql": 2,
  "postgresql": 2,
  "mysql": 2,
  
  "docker": 2,
  "kubernetes": 2,
  "ci/cd": 2,
  "devops": 2,
  "aws": 2,
  "linux": 1,
  
  "git": 2,
  "github": 2,
  "version control": 2,
  
  "rest api": 1,
  "graphql": 1,
  "agile": 1,
  "scrum": 1,
  "system design": 2,
  "microservices": 2,
  "data structures": 2,
  "algorithms": 2,
};

// ─── NEGATION PATTERNS (phrases that exclude/deny requirements) ────────────────
const NEGATION_PATTERNS = [
  /no\s+(programming|coding|developers|developers?)/gi,
  /no\s+(technical|background|experience)/gi,
  /no\s+(cloud|aws|azure|gcp)/gi,
  /no\s+(devops|ci\/cd|automation|pipeline)/gi,
  /no\s+(system\s+design|architecture|scalability)/gi,
  /no\s+(machine\s+learning|ai|artificial\s+intelligence|ml)/gi,
  /no\s+prior\s+experience/gi,
  /does\s+not?\s+involve|does\s+not?\s+require/gi,
  /not?\s+required|not?\s+necessary/gi,
  /freshers?\s+or\s+students\s+can\s+apply/gi,
  /non.technical\s+background/gi,
  /without\s+technical\s+knowledge/gi,
];

// ─── TECHNICAL INDICATOR PATTERNS ────────────────────────────────────────────
const TECHNICAL_INDICATORS = {
  high_technical: [
    /system\s+design/gi,
    /software\s+engineer/gi,
    /backend|frontend|fullstack/gi,
    /devops|sre/gi,
    /machine\s+learning|data\s+science|ai/gi,
    /api|microservices/gi,
  ],
  low_technical: [
    /non.technical/gi,
    /no\s+programming/gi,
    /freshers?\s+or\s+students/gi,
    /no\s+coding/gi,
    /manual\s+work/gi,
  ]
};

// ─── DETECT NEGATIONS IN JD ──────────────────────────────────────────────────
const detectNegations = (jdText) => {
  const negations = [];
  const jdLower = jdText.toLowerCase();
  
  for (const pattern of NEGATION_PATTERNS) {
    const matches = jdText.match(pattern);
    if (matches) {
      negations.push(...matches.map(m => m.toLowerCase()));
    }
  }
  
  return [...new Set(negations)];
};

// ─── CLASSIFY JOB ROLE INTENT ────────────────────────────────────────────────
const classifyRoleIntent = (jdText) => {
  const jdLower = jdText.toLowerCase();
  
  let technicalScore = 0;
  
  // Check high technical indicators
  for (const pattern of TECHNICAL_INDICATORS.high_technical) {
    if (pattern.test(jdText)) technicalScore += 2;
  }
  
  // Check low technical indicators (negates)
  for (const pattern of TECHNICAL_INDICATORS.low_technical) {
    if (pattern.test(jdText)) technicalScore -= 3;
  }
  
  if (technicalScore >= 1) return "technical";
  if (technicalScore <= -2) return "non-technical";
  return "hybrid";
};

// ─── EXTRACT EXCLUDED SKILLS FROM NEGATIONS ──────────────────────────────────
const extractExcludedSkills = (jdText) => {
  const excluded = [];
  const techKeywordPool = [
    "python", "javascript", "java", "typescript", "c++", "golang", "rust",
    "react", "angular", "vue", "node.js", "node", "express",
    "mongodb", "sql", "mysql", "postgresql",
    "aws", "azure", "gcp", "docker", "kubernetes", "devops", "ci/cd",
    "machine learning", "ml", "deep learning", "ai", "tensorflow", "pytorch",
    "system design", "architecture", "microservices",
    "api", "rest", "graphql", "database"
  ];
  
  const jdLower = jdText.toLowerCase();
  
  // Find skills mentioned after negation phrases
  for (const pattern of NEGATION_PATTERNS) {
    const matches = jdText.matchAll(pattern);
    for (const match of matches) {
      // Get context around negation (next 200 chars)
      const context = jdText.substring(match.index, match.index + 200).toLowerCase();
      
      // Find skills in this context
      for (const skill of techKeywordPool) {
        if (context.includes(skill)) {
          excluded.push(skill);
        }
      }
    }
  }
  
  return [...new Set(excluded)];
};

// ─── SEMANTIC SIMILARITY CHECK ────────────────────────────────────────────────
const isSkillCovered = (jdSkill, resumeSkills) => {
  const jdSkillLower = jdSkill.toLowerCase().trim();
  const synonyms = SKILL_SYNONYMS[jdSkillLower] || [jdSkillLower];
  
  for (const resumeSkill of resumeSkills) {
    const resumeSkillLower = resumeSkill.toLowerCase().trim();
    
    if (synonyms.includes(resumeSkillLower)) {
      return true;
    }
    
    for (const syn of synonyms) {
      if (syn.length > 3) {
        if (resumeSkillLower.includes(syn) || syn.includes(resumeSkillLower)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// ─── DETECT OVERQUALIFICATION ────────────────────────────────────────────────
const detectOverqualification = (resumeSkills, jdText, roleIntent) => {
  let resumeTechnicalScore = 0;
  const techSkills = [
    "python", "javascript", "java", "golang", "c++",
    "react", "node", "docker", "kubernetes",
    "aws", "azure", "devops", "ci/cd",
    "machine learning", "ai", "tensorflow", "pytorch",
    "system design", "microservices", "architecture"
  ];
  
  for (const skill of resumeSkills) {
    const skillLower = skill.toLowerCase();
    for (const techSkill of techSkills) {
      if (skillLower.includes(techSkill) || techSkill.includes(skillLower)) {
        resumeTechnicalScore += 2;
      }
    }
  }
  
  // If role is non-technical but resume is highly technical, penalize
  if (roleIntent === "non-technical" && resumeTechnicalScore > 5) {
    return true;
  }
  
  return false;
};

// ─── MAIN MATCHING FUNCTION ──────────────────────────────────────────────────
export const matchResumeWithJD = (resumeSkills, jdText) => {
  const jdLower = jdText.toLowerCase();
  const normalizedResumeSkills = resumeSkills.map(s => s.toLowerCase().trim());

  // Step 1: Classify job intent
  const roleIntent = classifyRoleIntent(jdText);
  console.log("🎯 Role Intent:", roleIntent);

  // Step 2: Detect negations and excluded skills
  const negations = detectNegations(jdText);
  const excludedSkills = extractExcludedSkills(jdText);
  console.log("⛔ Negations found:", negations);
  console.log("⛔ Excluded skills:", excludedSkills);

  // Step 3: Detect overqualification
  const isOverqualified = detectOverqualification(resumeSkills, jdText, roleIntent);
  console.log("🔴 Overqualified:", isOverqualified);

  // Step 4: If role is non-technical but resume has technical skills, this is a major red flag
  if (roleIntent === "non-technical" && normalizedResumeSkills.some(s => 
    ["python", "javascript", "java", "devops", "aws", "machine learning", "ai", "ci/cd"].some(t => s.includes(t))
  )) {
    console.log("⚠️ Major mismatch detected: Technical resume for non-technical role");
    return {
      matchScore: Math.max(5, Math.min(25, negations.length > 3 ? 10 : 20)),
      matchedSkills: [],
      missingSkills: excludedSkills,
      warning: "Resume is overqualified for this non-technical role. Skillset mismatch."
    };
  }

  // Step 5: Extract required skills
  // Fix for incorrect “missingSkills” in non-matching domains.
  // The previous implementation used a broad technical keyword pool (including single-letter
  // tokens like "r"), causing irrelevant requirements to be considered for every role.
  //
  // Redesigned behavior:
  // 1) Prefer explicit skill extraction from JD text.
  // 2) If marketing/business signals are present, treat marketing terms as the required skills
  //    and avoid using the technical pool.
  // 3) Filter out false positives like single-letter tokens.

  const extractExplicitSkillsFromJD = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const skillCandidates = [];
    const sectionOrListLine = /(\bskills\b|\brequirements\b|\bqualifications\b|\bpreferred\b|\bmust\b|\byou should\b|\bresponsibilities\b)/i;

    for (const line of lines) {
      const lower = line.toLowerCase();
      const hasListDelim = /[-•]/.test(line) || /[,;/]/.test(line);

      // Skip very long prose lines to reduce noise
      if (!hasListDelim && !sectionOrListLine.test(lower)) {
        if (lower.length > 120) continue;
      }

      const parts = line
        .replace(/[-•]/g, ",")
        .split(/[,;/]|\s+and\s+/i)
        .map(p => p.trim())
        .filter(Boolean);

      for (const p of parts) {
        // Keep likely skill phrases
        if (
          /(\bseo\b|digital marketing|social media|content creation|branding|campaign|lead generation|analytics|google analytics|adwords|ppc|paid media|copywriting)/i.test(p) ||
          /(\b(skill|skills)\b)/i.test(p) ||
          /\b(react|javascript|typescript|python|machine learning|ai|ml|nlp|sql|mongodb|node|express|git|github|rest\s*api|aws|azure|gcp|docker|kubernetes|ci\/cd|tableau|power bi|excel)\b/i.test(p) ||
          p.length <= 25
        ) {
          skillCandidates.push(p);
        }
      }
    }

    return [...new Set(skillCandidates)];
  };

  const canonicalizeJDSkill = (s) => {
    const t = String(s).toLowerCase().trim();

    if (/(google analytics|\bga\b)/i.test(t)) return "google analytics";
    if (/(search engine optimization|\bseo\b)/i.test(t)) return "seo";
    if (/(digital marketing|performance marketing|ppc|paid media)/i.test(t)) return "digital marketing";
    if (/(social media|social-media)/i.test(t)) return "social media marketing";
    if (/(content creation|content|copywriting)/i.test(t)) return "content creation";
    if (/(branding|brand)/i.test(t)) return "branding";
    if (/(campaign management|campaign|email marketing|newsletter)/i.test(t)) return "campaign management";
    if (/(lead generation|lead gen)/i.test(t)) return "lead generation";

    if (t === "ml") return "machine learning";
    if (t === "ai") return "ai";

    return t;
  };

  const jdExplicit = extractExplicitSkillsFromJD(jdText).map(canonicalizeJDSkill);

  const hasMarketingSignals = [
    "seo",
    "digital marketing",
    "social media",
    "google analytics",
    "ppc",
    "paid media",
    "content creation",
    "branding",
    "campaign",
    "lead generation"
  ].some(k => jdLower.includes(k));

  const marketingRequiredSkills = [
    "seo",
    "digital marketing",
    "social media marketing",
    "content creation",
    "branding",
    "campaign management",
    "lead generation",
    "google analytics",
    "analytics"
  ].filter(k => jdLower.includes(k) || jdExplicit.includes(k));

  const technicalPool = [
    "python", "javascript", "typescript", "java", "c++", "react", "node", "express", "sql", "mongodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "machine learning", "deep learning", "ai",
    "tensorflow", "pytorch", "nlp", "computer vision", "git", "github", "rest api", "graphql",
    "jira", "agile", "scrum", "system design", "architecture", "microservices"
  ];

  let jdRequiredSkills = [];

  if (hasMarketingSignals) {
    // Marketing roles: only consider marketing/business-required terms.
    jdRequiredSkills = marketingRequiredSkills.length ? marketingRequiredSkills : jdExplicit.slice(0, 25);
  } else {
    // Technical roles: consider technical pool matches plus explicit extracted skills.
    const fromPool = technicalPool.filter(skill => jdLower.includes(skill));
    const explicitTechnical = jdExplicit.filter(s => technicalPool.some(tp => s.includes(tp) || tp.includes(s)));
    jdRequiredSkills = [...new Set([...explicitTechnical, ...fromPool])].slice(0, 30);
  }

  // Remove false positives: single-letter tokens like "r"
  jdRequiredSkills = jdRequiredSkills
    .map(s => String(s).toLowerCase().trim())
    .filter(s => s.length > 1);

  if (jdRequiredSkills.length === 0) {
    return {
      matchScore: roleIntent === "non-technical" ? 30 : 20,
      matchedSkills: [],
      missingSkills: [],
      warning: "Could not extract specific skills from job description"
    };
  }

  // Step 6: Calculate match with penalties for excluded skills
  let matchedSkills = [];
  let missingSkills = [];
  let totalWeight = 0;
  let matchedWeight = 0;
  let penaltyScore = 0;

  for (const required of jdRequiredSkills) {
    const weight = SKILL_WEIGHTS[required] || 1;
    totalWeight += weight;
    
    // Check if skill is in excluded list
    const isExcluded = excludedSkills.some(ex => 
      required.includes(ex) || ex.includes(required)
    );
    
    if (isExcluded) {
      // If resume HAS this excluded skill, apply heavy penalty
      if (isSkillCovered(required, normalizedResumeSkills)) {
        console.log(`❌ Resume has excluded skill: ${required}`);
        penaltyScore += weight * 3; // 3x penalty for having excluded skills
      }
      missingSkills.push(required);
    } else {
      // Normal matching
      const isCovered = isSkillCovered(required, normalizedResumeSkills);
      if (isCovered) {
        matchedSkills.push(required);
        matchedWeight += weight;
      } else {
        missingSkills.push(required);
      }
    }
  }

  // Step 7: Calculate final score
  const rawScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  
  // Apply negation penalty
  let finalScore = Math.max(0, rawScore - penaltyScore);
  
  // Apply negation count penalty (more negations = lower score)
  if (negations.length >= 3) {
    finalScore = Math.max(5, finalScore * 0.6);
  } else if (negations.length >= 1) {
    finalScore = Math.max(5, finalScore * 0.8);
  }
  
  // Apply overqualification penalty
  if (isOverqualified) {
    finalScore = Math.max(5, finalScore * 0.5);
  }

  return {
    matchScore: Math.max(5, Math.min(95, Math.round(finalScore))),
    matchedSkills: [...new Set(matchedSkills)],
    missingSkills: [...new Set(missingSkills)],
    analysis: {
      roleIntent,
      negationCount: negations.length,
      isOverqualified,
      excludedSkillsFound: excludedSkills.filter(s => 
        isSkillCovered(s, normalizedResumeSkills)
      )
    }
  };
};
