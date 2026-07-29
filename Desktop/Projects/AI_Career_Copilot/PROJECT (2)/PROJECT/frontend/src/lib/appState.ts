export interface Application {
  id: string;
  company: string;
  role: string;
  status: 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  atsScore?: number;
  applicationDate?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewRound?: string;
  notes?: string;
  jobDescription?: string;
  resumeVersion?: string;
  source?: 'Manual' | 'Job Analysis' | 'ATS Score';
  priority?: 'Low' | 'Medium' | 'High';
  companyLogo?: string;
  lastStatusChange: string;
  history?: {
    from: string;
    to: string;
    date: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  version: number;
  sessionStartedAt: string;
  resume: {
    uploaded: boolean;
    fileName: string;
    uploadedAt: string;
    resumeText: string;
    skills: string[];
    original?: any;
    optimized?: any;
    activeVersion?: string;
  };
  analyses: {
    history: any[];
    latestAnalysis: any | null;
    jobDesc: string;
  };
  atsScore: {
    resumeText: string;
    jobDescription: string;
    atsReport: any | null;
  };
  gapCloser: {
    activeRoadmapId: string;
    roadmaps: Record<string, any>;
    progress: Record<string, Record<string, boolean>>;
    learnedSkills: string[];
    analytics: {
      roadmapsGenerated: number;
      skillsCompleted: number;
      mostSelectedSkill: string;
    };
  };
  interviewPrep: {
    activeSessionId: string;
    completedQuestions: Record<string, boolean>;
  };
  applications: Application[];
  applicationAnalytics: {
    generatedAt: string;
    insights: any[];
    roleDistribution: Record<string, number>;
    companyDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
  };
}

export const CURRENT_APP_STATE_VERSION = 1;

export const DEFAULT_APP_STATE: AppState = {
  version: CURRENT_APP_STATE_VERSION,
  sessionStartedAt: "",
  resume: {
    uploaded: false,
    fileName: "",
    uploadedAt: "",
    resumeText: "",
    skills: [],
  },
  analyses: {
    history: [],
    latestAnalysis: null,
    jobDesc: "",
  },
  atsScore: {
    resumeText: "",
    jobDescription: "",
    atsReport: null,
  },
  gapCloser: {
    activeRoadmapId: "",
    roadmaps: {},
    progress: {},
    learnedSkills: [],
    analytics: {
      roadmapsGenerated: 0,
      skillsCompleted: 0,
      mostSelectedSkill: "",
    },
  },
  interviewPrep: {
    activeSessionId: "",
    completedQuestions: {},
  },
  applications: [],
  applicationAnalytics: {
    generatedAt: "",
    insights: [],
    roleDistribution: {},
    companyDistribution: {},
    statusDistribution: {}
  }
};

/**
 * Perform schema migrations incrementally.
 */
function migrateState(state: any, fromVersion: number): AppState {
  let migrated = { ...state };
  migrated.version = CURRENT_APP_STATE_VERSION;
  console.log(`[APP STATE MIGRATED] Upgraded schema from version ${fromVersion} to ${CURRENT_APP_STATE_VERSION}`);
  return migrated;
}

/**
 * Merge a server workspace payload into AppState shape.
 * Server may return partial data — merge safely with defaults.
 */
export function mergeServerWorkspace(serverWorkspace: any): AppState {
  if (!serverWorkspace) return { ...DEFAULT_APP_STATE };

    const mergedResume = { ...DEFAULT_APP_STATE.resume, ...(serverWorkspace.resume || {}) };
    
    // Normalize new CanonicalResume format for legacy frontend consumers
    if (mergedResume.original) {
      mergedResume.uploaded = mergedResume.original.uploaded || mergedResume.uploaded;
      mergedResume.fileName = mergedResume.original.fileName || mergedResume.fileName;
      mergedResume.uploadedAt = mergedResume.original.uploadedAt || mergedResume.uploadedAt;
      mergedResume.resumeText = mergedResume.original.rawText || mergedResume.resumeText;
      mergedResume.skills = mergedResume.original.structuredData?.skills || mergedResume.skills;
    }

    const state: AppState = {
      ...DEFAULT_APP_STATE,
      version: serverWorkspace.version ?? CURRENT_APP_STATE_VERSION,
      sessionStartedAt: serverWorkspace.sessionStartedAt ?? "",
      resume: mergedResume,
    analyses: { ...DEFAULT_APP_STATE.analyses, ...(serverWorkspace.analyses || {}) },
    atsScore: { ...DEFAULT_APP_STATE.atsScore, ...(serverWorkspace.atsScore || {}) },
    gapCloser: {
      ...DEFAULT_APP_STATE.gapCloser,
      ...(serverWorkspace.gapCloser || {}),
      analytics: {
        ...DEFAULT_APP_STATE.gapCloser.analytics,
        ...(serverWorkspace.gapCloser?.analytics || {})
      }
    },
    interviewPrep: { ...DEFAULT_APP_STATE.interviewPrep, ...(serverWorkspace.interviewPrep || {}) },
    applications: Array.isArray(serverWorkspace.applications) ? serverWorkspace.applications : [],
    applicationAnalytics: { ...DEFAULT_APP_STATE.applicationAnalytics, ...(serverWorkspace.applicationAnalytics || {}) }
  };

  if (state.version < CURRENT_APP_STATE_VERSION) {
    return migrateState(state, state.version);
  }

  return state;
}

/**
 * Loads the application state from localStorage, scoped by user ID.
 * Used as the INITIAL value before server sync completes.
 */
export function loadAppState(userId?: string): AppState {
  const scope = userId || "guest";
  const userScopedKey = `appState_${scope}`;
  const raw = localStorage.getItem(userScopedKey);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      let state = { ...DEFAULT_APP_STATE };

      const sections: (keyof AppState)[] = ["resume", "analyses", "atsScore", "gapCloser", "interviewPrep", "applications", "applicationAnalytics"];
      sections.forEach((section) => {
        try {
          if (parsed[section] !== undefined && parsed[section] !== null) {
            state[section] = parsed[section] as any;
          }
        } catch (sectionError) {
          console.warn(`[APP STATE RECOVERED] Corrupted section '${section}' reset to default.`, sectionError);
          state[section] = DEFAULT_APP_STATE[section] as any;
        }
      });

      state.version = parsed.version || 0;
      if (state.version < CURRENT_APP_STATE_VERSION) {
        state = migrateState(state, state.version);
        saveAppState(state, scope);
      }
      
      // Normalize new CanonicalResume format for legacy frontend consumers
      if (state.resume.original) {
        state.resume.uploaded = state.resume.original.uploaded || state.resume.uploaded;
        state.resume.fileName = state.resume.original.fileName || state.resume.fileName;
        state.resume.uploadedAt = state.resume.original.uploadedAt || state.resume.uploadedAt;
        state.resume.resumeText = state.resume.original.rawText || state.resume.resumeText;
        state.resume.skills = state.resume.original.structuredData?.skills || state.resume.skills;
      }

      console.log(`[WORKSPACE] Restored from localStorage for ${scope}`);
      return state;
    } catch (err) {
      console.error("[APP STATE] localStorage parse failed. Resetting.", err);
      saveAppState(DEFAULT_APP_STATE, scope);
      return { ...DEFAULT_APP_STATE };
    }
  }

  // Migrate legacy global appState key
  if (scope !== "guest") {
    const globalRaw = localStorage.getItem("appState");
    if (globalRaw) {
      try {
        const parsedGlobal = JSON.parse(globalRaw);
        console.log("[MIGRATION] Legacy workspace found. Migrating to scoped key.");
        saveAppState(parsedGlobal, scope);
        const legacyKeys = ["appState", "resumeText", "resumeSkills", "analysisHistory", "latestAnalysis", "applications", "gapCloserData"];
        legacyKeys.forEach(key => localStorage.removeItem(key));
        return parsedGlobal;
      } catch (migrationError) {
        console.error("[MIGRATION] Failed:", migrationError);
      }
    }
  }

  return { ...DEFAULT_APP_STATE };
}

/**
 * Saves appState to localStorage, scoped by user ID.
 */
export function saveAppState(state: AppState, userId?: string) {
  const scope = userId || "guest";
  try {
    localStorage.setItem(`appState_${scope}`, JSON.stringify(state));
    localStorage.setItem(`resumeText_${scope}`, state.resume.resumeText);
    localStorage.setItem(`resumeSkills_${scope}`, JSON.stringify(state.resume.skills));
    localStorage.setItem(`analysisHistory_${scope}`, JSON.stringify(state.analyses.history));
    localStorage.setItem(`latestAnalysis_${scope}`, JSON.stringify(state.analyses.latestAnalysis));
    localStorage.setItem(`applications_${scope}`, JSON.stringify(state.applications));
    const legacyGapData = {
      roadmaps: state.gapCloser.roadmaps,
      progress: state.gapCloser.progress,
      learnedSkills: state.gapCloser.learnedSkills,
      analytics: state.gapCloser.analytics
    };
    localStorage.setItem(`gapCloserData_${scope}`, JSON.stringify(legacyGapData));
  } catch (err) {
    console.error(`[APP STATE] Failed to save to localStorage for ${scope}:`, err);
  }
}

/**
 * Starts a new session by clearing current working/active page inputs and data.
 */
export function startNewSession(state: AppState, userId?: string): AppState {
  const scope = userId || "guest";
  const nextState: AppState = {
    ...state,
    sessionStartedAt: new Date().toISOString(),
    resume: {
      uploaded: false,
      fileName: "",
      uploadedAt: "",
      resumeText: "",
      skills: [],
    },
    analyses: {
      ...state.analyses,
      latestAnalysis: null,
      jobDesc: "",
    },
    atsScore: {
      resumeText: "",
      jobDescription: "",
      atsReport: null,
    },
    gapCloser: {
      ...state.gapCloser,
      activeRoadmapId: "",
    },
    interviewPrep: {
      activeSessionId: "",
      completedQuestions: {},
    },
  };
  saveAppState(nextState, scope);
  return nextState;
}

/**
 * Wipes all application-specific state keys for a single user scope.
 */
export function factoryReset(userId?: string): AppState {
  const scope = userId || "guest";
  const keysToClear = [
    `appState_${scope}`,
    `resumeText_${scope}`,
    `resumeSkills_${scope}`,
    `analysisHistory_${scope}`,
    `latestAnalysis_${scope}`,
    `gapCloserData_${scope}`,
    `applications_${scope}`
  ];
  keysToClear.forEach(key => localStorage.removeItem(key));
  console.log(`[APP STATE] Factory reset for ${scope}`);
  return { ...DEFAULT_APP_STATE };
}
