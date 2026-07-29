import mongoose from "mongoose";

/**
 * Workspace — stores the complete client-side AppState for a user on the server.
 * This enables cross-device persistence: when a user logs in from a new device,
 * their workspace is fetched from the server rather than being empty.
 */
const workspaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // supports both ObjectId and string (inMemory IDs)
      required: true,
      unique: true,
      index: true
    },

    // Canonical Resume Object
    resume: {
      original: { type: mongoose.Schema.Types.Mixed, default: null },
      optimized: { type: mongoose.Schema.Types.Mixed, default: null }
    },

    // Canonical Analysis Object
    analysis: {
      original: { type: mongoose.Schema.Types.Mixed, default: null },
      optimized: { type: mongoose.Schema.Types.Mixed, default: null },
      version: { type: Number, default: 1 }
    },

    // Job Description
    jobDescription: { type: String, default: "" },
    
    // Optimization Planner State
    optimizationPlan: { type: mongoose.Schema.Types.Mixed, default: null },

    // Legacy fields (kept temporarily for backward compatibility)
    analyses: { type: mongoose.Schema.Types.Mixed, default: {} },
    atsScore: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Skill Gap Closer
    gapCloser: {
      activeRoadmapId: { type: String, default: "" },
      roadmaps:        { type: mongoose.Schema.Types.Mixed, default: {} },
      progress:        { type: mongoose.Schema.Types.Mixed, default: {} },
      learnedSkills:   { type: [String], default: [] },
      analytics: {
        roadmapsGenerated:  { type: Number, default: 0 },
        skillsCompleted:    { type: Number, default: 0 },
        mostSelectedSkill:  { type: String, default: "" }
      }
    },

    // Interview Prep
    interviewPrep: {
      activeSessionId:    { type: String, default: "" },
      completedQuestions: { type: mongoose.Schema.Types.Mixed, default: {} }
    },

    // Job Applications
    applications: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Career Analytics
    applicationAnalytics: {
      generatedAt:          { type: String, default: "" },
      insights:             { type: mongoose.Schema.Types.Mixed, default: [] },
      roleDistribution:     { type: mongoose.Schema.Types.Mixed, default: {} },
      companyDistribution:  { type: mongoose.Schema.Types.Mixed, default: {} },
      statusDistribution:   { type: mongoose.Schema.Types.Mixed, default: {} }
    },

    // Schema version for future migrations
    version: { type: Number, default: 1 },

    lastSyncedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
