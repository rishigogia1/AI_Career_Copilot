import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // Add these two fields inside your schema
  role: {
    type: String,
    default: "Software Engineer"
  },
  company: {
    type: String,
    default: "Not Specified"
  },

    resumeSkills: [String],
    jobDescription: String,

    matchScore: Number,
    matchedSkills: [String],
    missingSkills: [String],

    suggestions: [String],

    // 🔥 FIXED STRUCTURE
    interviewQuestions: {
      technical: [mongoose.Schema.Types.Mixed],
      behavioral: [mongoose.Schema.Types.Mixed]
    }

  },
  {
    timestamps: true // 🔥 IMPORTANT (for history chart)
  }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;