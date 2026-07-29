import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    fullName: { type: String, default: "" },
    targetRole: { type: String, default: "" },
    careerGoal: { 
      type: String, 
      enum: ["Data Analyst", "Data Scientist", "ML Engineer", "Full Stack Developer", "Software Engineer", "Cybersecurity Analyst", "Custom"],
      default: "Software Engineer"
    },
    college: { type: String, default: "" },
    graduationYear: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    bio: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    onboardingComplete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
