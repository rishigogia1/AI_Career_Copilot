import bcrypt from "bcrypt";
import mongoose from "mongoose";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import { inMemoryDB, saveInMemoryDB } from "../config/db.js";

// ─────────────────────────────────────────
// 👤 GET PROFILE
// ─────────────────────────────────────────
export const getProfileController = async (req, res) => {
  try {
    let user;
    let profile;
    let isInMemory = mongoose.connection.readyState !== 1;

    if (!isInMemory) {
      try {
        user = await User.findById(req.userId);
        if (user) {
          profile = await Profile.findOne({ userId: req.userId });
          if (!profile) {
            // Sync/Migrate local offline fallback details to MongoDB if available
            const demoProfile = inMemoryDB.profiles.find(p => p.userId === req.userId);
            if (demoProfile) {
              console.log(`[MIGRATION] Restored MongoDB connection: Syncing local offline profile for user ${req.userId}`);
              profile = await Profile.create({
                userId: req.userId,
                fullName: demoProfile.fullName || user.name || "",
                targetRole: demoProfile.targetRole || "",
                careerGoal: demoProfile.careerGoal || "Software Engineer",
                college: demoProfile.college || "",
                graduationYear: demoProfile.graduationYear || "",
                linkedin: demoProfile.linkedin || "",
                github: demoProfile.github || "",
                portfolio: demoProfile.portfolio || "",
                bio: demoProfile.bio || "",
                profilePicture: demoProfile.profilePicture || "",
                onboardingComplete: demoProfile.onboardingComplete || false
              });
            } else {
              profile = await Profile.create({
                userId: req.userId,
                fullName: user.name || "",
                targetRole: "",
                careerGoal: "Software Engineer",
                college: "",
                graduationYear: "",
                linkedin: "",
                github: "",
                portfolio: "",
                bio: "",
                profilePicture: ""
              });
            }
          }
        }
      } catch (dbError) {
        isInMemory = true;
      }
    }

    if (isInMemory || !user) {
      // In-memory fallback
      const demoUser = inMemoryDB.users.find(u => u._id === req.userId) || { name: req.userName || "User", email: req.userEmail || "" };
      let demoProfile = inMemoryDB.profiles.find(p => p.userId === req.userId);
      if (!demoProfile) {
        demoProfile = {
          userId: req.userId,
          fullName: demoUser.name,
          targetRole: "",
          careerGoal: "Software Engineer",
          college: "",
          graduationYear: "",
          linkedin: "",
          github: "",
          portfolio: "",
          bio: "",
          profilePicture: ""
        };
        inMemoryDB.profiles.push(demoProfile);
        saveInMemoryDB();
      }
      return res.json({ ...demoProfile, email: demoUser.email });
    }

    const profileObj = profile.toObject ? profile.toObject() : profile;
    return res.json({ ...profileObj, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// ✏️ UPDATE PROFILE
// ─────────────────────────────────────────
export const updateProfileController = async (req, res) => {
  try {
    const {
      fullName,
      targetRole,
      careerGoal,
      college,
      graduationYear,
      linkedin,
      github,
      portfolio,
      bio,
      profilePicture,
      onboardingComplete
    } = req.body;

    if (linkedin && !linkedin.match(/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i)) {
      return res.status(400).json({ message: "Invalid LinkedIn URL. Must start with https://linkedin.com/ or https://www.linkedin.com/" });
    }

    if (github && !github.match(/^(https?:\/\/)?(www\.)?github\.com\/.*$/i)) {
      return res.status(400).json({ message: "Invalid GitHub URL. Must start with https://github.com/ or https://www.github.com/" });
    }

    if (portfolio && !portfolio.match(/^https?:\/\/.*$/i)) {
      return res.status(400).json({ message: "Invalid Portfolio URL. Must start with http:// or https://" });
    }

    let profile;
    let isInMemory = mongoose.connection.readyState !== 1;

    if (!isInMemory) {
      try {
        profile = await Profile.findOne({ userId: req.userId });
        if (profile) {
          profile.fullName = fullName !== undefined ? fullName : profile.fullName;
          profile.targetRole = targetRole !== undefined ? targetRole : profile.targetRole;
          profile.careerGoal = careerGoal !== undefined ? careerGoal : profile.careerGoal;
          profile.college = college !== undefined ? college : profile.college;
          profile.graduationYear = graduationYear !== undefined ? graduationYear : profile.graduationYear;
          profile.linkedin = linkedin !== undefined ? linkedin : profile.linkedin;
          profile.github = github !== undefined ? github : profile.github;
          profile.portfolio = portfolio !== undefined ? portfolio : profile.portfolio;
          profile.bio = bio !== undefined ? bio : profile.bio;
          profile.profilePicture = profilePicture !== undefined ? profilePicture : profile.profilePicture;
          profile.onboardingComplete = onboardingComplete !== undefined ? onboardingComplete : profile.onboardingComplete;
          await profile.save();
        } else {
          // If not in MongoDB, check if there is an in-memory profile to start with
          const demoProfile = inMemoryDB.profiles.find(p => p.userId === req.userId);
          profile = await Profile.create({
            userId: req.userId,
            fullName: fullName !== undefined ? fullName : (demoProfile ? demoProfile.fullName : ""),
            targetRole: targetRole !== undefined ? targetRole : (demoProfile ? demoProfile.targetRole : ""),
            careerGoal: careerGoal !== undefined ? careerGoal : (demoProfile ? demoProfile.careerGoal : "Software Engineer"),
            college: college !== undefined ? college : (demoProfile ? demoProfile.college : ""),
            graduationYear: graduationYear !== undefined ? graduationYear : (demoProfile ? demoProfile.graduationYear : ""),
            linkedin: linkedin !== undefined ? linkedin : (demoProfile ? demoProfile.linkedin : ""),
            github: github !== undefined ? github : (demoProfile ? demoProfile.github : ""),
            portfolio: portfolio !== undefined ? portfolio : (demoProfile ? demoProfile.portfolio : ""),
            bio: bio !== undefined ? bio : (demoProfile ? demoProfile.bio : ""),
            profilePicture: profilePicture !== undefined ? profilePicture : (demoProfile ? demoProfile.profilePicture : ""),
            onboardingComplete: onboardingComplete !== undefined ? onboardingComplete : (demoProfile ? demoProfile.onboardingComplete : false)
          });
        }
      } catch (dbError) {
        isInMemory = true;
      }
    }

    if (isInMemory) {
      // In-memory update
      let demoProfile = inMemoryDB.profiles.find(p => p.userId === req.userId);
      if (!demoProfile) {
        demoProfile = {
          userId: req.userId,
          fullName: fullName || "",
          targetRole: targetRole || "",
          careerGoal: careerGoal || "Software Engineer",
          college: college || "",
          graduationYear: graduationYear || "",
          linkedin: linkedin || "",
          github: github || "",
          portfolio: portfolio || "",
          bio: bio || "",
          profilePicture: profilePicture || "",
          onboardingComplete: onboardingComplete || false
        };
        inMemoryDB.profiles.push(demoProfile);
      } else {
        demoProfile.fullName = fullName !== undefined ? fullName : demoProfile.fullName;
        demoProfile.targetRole = targetRole !== undefined ? targetRole : demoProfile.targetRole;
        demoProfile.careerGoal = careerGoal !== undefined ? careerGoal : demoProfile.careerGoal;
        demoProfile.college = college !== undefined ? college : demoProfile.college;
        demoProfile.graduationYear = graduationYear !== undefined ? graduationYear : demoProfile.graduationYear;
        demoProfile.linkedin = linkedin !== undefined ? linkedin : demoProfile.linkedin;
        demoProfile.github = github !== undefined ? github : demoProfile.github;
        demoProfile.portfolio = portfolio !== undefined ? portfolio : demoProfile.portfolio;
        demoProfile.bio = bio !== undefined ? bio : demoProfile.bio;
        demoProfile.profilePicture = profilePicture !== undefined ? profilePicture : demoProfile.profilePicture;
        demoProfile.onboardingComplete = onboardingComplete !== undefined ? onboardingComplete : demoProfile.onboardingComplete;
      }
      profile = demoProfile;
      saveInMemoryDB();
    }

    console.log("[DEBUG] Database record after update:", profile);
    res.json({ message: "Profile updated successfully", profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// ✏️ UPDATE NAME (LEGACY / BACKWARD COMPATIBILITY)
// ─────────────────────────────────────────
export const updateNameController = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    let user;
    let isInMemory = mongoose.connection.readyState !== 1;

    if (!isInMemory) {
      try {
        user = await User.findByIdAndUpdate(
          req.userId,
          { name: name.trim() },
          { new: true }
        ).select("-password -verificationToken -resetPasswordToken");
        
        // Sync to profile as well
        await Profile.findOneAndUpdate(
          { userId: req.userId },
          { fullName: name.trim() }
        );
      } catch (dbError) {
        isInMemory = true;
      }
    }

    if (isInMemory) {
      const demoUser = inMemoryDB.users.find(u => u._id === req.userId);
      if (demoUser) {
        demoUser.name = name.trim();
        user = demoUser;
      }
      let demoProfile = inMemoryDB.profiles.find(p => p.userId === req.userId);
      if (demoProfile) {
        demoProfile.fullName = name.trim();
      }
      saveInMemoryDB();
    }

    res.json({ message: "Name updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 🔑 CHANGE PASSWORD
// ─────────────────────────────────────────
export const changePasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    let isInMemory = mongoose.connection.readyState !== 1;

    if (!isInMemory) {
      try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();
      } catch (dbError) {
        isInMemory = true;
      }
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 🖼️ UPLOAD AVATAR (LEGACY / BACKWARD COMPATIBILITY)
// ─────────────────────────────────────────
export const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    let isInMemory = mongoose.connection.readyState !== 1;

    if (!isInMemory) {
      try {
        await User.findByIdAndUpdate(req.userId, { avatar: avatarUrl });
        await Profile.findOneAndUpdate({ userId: req.userId }, { profilePicture: avatarUrl });
      } catch (dbError) {
        isInMemory = true;
      }
    }

    if (isInMemory) {
      let demoProfile = inMemoryDB.profiles.find(p => p.userId === req.userId);
      if (demoProfile) {
        demoProfile.profilePicture = avatarUrl;
        saveInMemoryDB();
      }
    }

    res.json({ message: "Avatar updated successfully", avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 🗑️ DELETE ACCOUNT
// ─────────────────────────────────────────
export const deleteAccountController = async (req, res) => {
  try {
    let isInMemory = mongoose.connection.readyState !== 1;

    if (!isInMemory) {
      try {
        await User.findByIdAndDelete(req.userId);
        await Profile.findOneAndDelete({ userId: req.userId });
      } catch (dbError) {
        isInMemory = true;
      }
    }

    if (isInMemory) {
      inMemoryDB.users = inMemoryDB.users.filter(u => u._id !== req.userId);
      inMemoryDB.profiles = inMemoryDB.profiles.filter(p => p.userId !== req.userId);
      saveInMemoryDB();
    }
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
