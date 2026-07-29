import Workspace from "../models/Workspace.js";
import { inMemoryDB, saveInMemoryDB, isMongoConnected } from "../config/db.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workspace
// Returns the authenticated user's full workspace. Used on login to restore state.
// ─────────────────────────────────────────────────────────────────────────────
export const getWorkspaceController = async (req, res) => {
  try {
    const userId = req.userId;

    // Try MongoDB first if connected
    let workspace = null;
    try {
      if (!isMongoConnected) {
        throw new Error("MongoDB is offline");
      }
      workspace = await Workspace.findOne({ userId }).lean();
    } catch (dbErr) {
      console.warn("[WORKSPACE GET] MongoDB unavailable, checking inMemoryDB:", dbErr.message);
      // Fall back to inMemoryDB
      workspace = inMemoryDB.workspaces?.find(w => String(w.userId) === String(userId)) || null;
    }

    if (!workspace) {
      // New user — return empty workspace signal
      return res.json({
        found: false,
        workspace: null,
        message: "No workspace found. Starting fresh."
      });
    }

    const responseWorkspace = {
      found: true,
      workspace: {
        version:              workspace.version,
        resume:               workspace.resume,
        analyses:             workspace.analyses,
        atsScore:             workspace.atsScore,
        gapCloser:            workspace.gapCloser,
        interviewPrep:        workspace.interviewPrep,
        applications:         workspace.applications,
        applicationAnalytics: workspace.applicationAnalytics,
        lastSyncedAt:         workspace.lastSyncedAt
      }
    };

    const latestMatchGet = responseWorkspace.workspace.analyses?.latestAnalysis?.match;
    console.log({
        stage: "7. GET /workspace",
        matchedSkills: latestMatchGet?.matchedSkills?.length,
        missingSkills: latestMatchGet?.missingSkills?.length,
        strengths: latestMatchGet?.strengths?.length,
        weaknesses: latestMatchGet?.weaknesses?.length,
        atsScore: latestMatchGet?.matchScore,
        keys: latestMatchGet ? Object.keys(latestMatchGet) : []
    });

    return res.json(responseWorkspace);

  } catch (err) {
    console.error("[WORKSPACE GET ERROR]", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/workspace
// Saves (upserts) the authenticated user's full workspace.
// Called from the frontend debounced save whenever appState changes.
// ─────────────────────────────────────────────────────────────────────────────
export const saveWorkspaceController = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      version,
      resume,
      analyses,
      atsScore,
      gapCloser,
      interviewPrep,
      applications,
      applicationAnalytics
    } = req.body;

    const workspaceData = {
      userId,
      version:              version || 1,
      resume:               resume || {},
      analyses:             analyses || {},
      atsScore:             atsScore || {},
      gapCloser:            gapCloser || {},
      interviewPrep:        interviewPrep || {},
      applications:         applications || [],
      applicationAnalytics: applicationAnalytics || {},
      lastSyncedAt:         new Date()
    };

    const latestMatch = workspaceData.analyses?.latestAnalysis?.match;
    console.log({
        stage: "5. Workspace Before Save",
        matchedSkills: latestMatch?.matchedSkills?.length,
        missingSkills: latestMatch?.missingSkills?.length,
        strengths: latestMatch?.strengths?.length,
        weaknesses: latestMatch?.weaknesses?.length,
        atsScore: latestMatch?.matchScore,
        keys: latestMatch ? Object.keys(latestMatch) : []
    });

    // Try MongoDB upsert if connected
    try {
      if (!isMongoConnected) {
        throw new Error("MongoDB is offline");
      }
      await Workspace.findOneAndUpdate(
        { userId },
        { $set: workspaceData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (dbErr) {
      console.warn("[WORKSPACE SAVE] MongoDB unavailable, saving to inMemoryDB:", dbErr.message);
      if (!inMemoryDB.workspaces) inMemoryDB.workspaces = [];
      const idx = inMemoryDB.workspaces.findIndex(w => String(w.userId) === String(userId));
      if (idx >= 0) {
        inMemoryDB.workspaces[idx] = workspaceData;
      } else {
        inMemoryDB.workspaces.push(workspaceData);
      }
      saveInMemoryDB();
    }

    console.log({
        stage: "6. Workspace After Save",
        matchedSkills: latestMatch?.matchedSkills?.length,
        missingSkills: latestMatch?.missingSkills?.length,
        strengths: latestMatch?.strengths?.length,
        weaknesses: latestMatch?.weaknesses?.length,
        atsScore: latestMatch?.matchScore,
        keys: latestMatch ? Object.keys(latestMatch) : []
    });

    return res.json({ success: true, message: "Workspace saved." });

  } catch (err) {
    console.error("[WORKSPACE SAVE ERROR]", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/workspace
// Wipes the user's workspace (factory reset).
// ─────────────────────────────────────────────────────────────────────────────
export const resetWorkspaceController = async (req, res) => {
  try {
    const userId = req.userId;

    try {
      if (!isMongoConnected) {
        throw new Error("MongoDB is offline");
      }
      await Workspace.findOneAndDelete({ userId });
    } catch (dbErr) {
      if (inMemoryDB.workspaces) {
        inMemoryDB.workspaces = inMemoryDB.workspaces.filter(w => String(w.userId) !== String(userId));
        saveInMemoryDB();
      }
    }

    return res.json({ success: true, message: "Workspace reset." });
  } catch (err) {
    console.error("[WORKSPACE RESET ERROR]", err.message);
    res.status(500).json({ message: err.message });
  }
};
