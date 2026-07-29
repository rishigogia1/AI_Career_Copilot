import Workspace from "../models/Workspace.js";
import { isMongoConnected, inMemoryDB, saveInMemoryDB } from "../config/db.js";
import { logger } from "./logger.js";

/**
 * Ensures a workspace exists for the user. If not, it creates a default canonical one.
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The workspace document (or in-memory object)
 */
export const getOrCreateWorkspace = async (userId) => {
  const defaultWorkspace = {
    userId,
    resume: {
      original: null,
      optimized: null,
      activeVersion: "original"
    },
    analysis: {
      original: null,
      optimized: null
    },
    jobDescription: "",
    optimizationPlan: null,
    version: 1,
    updatedAt: new Date()
  };

  if (!userId) {
    throw new Error("userId is required to getOrCreateWorkspace");
  }

  try {
    if (isMongoConnected) {
      let workspace = await Workspace.findOne({ userId }).lean();
      if (!workspace) {
        logger.info({ userId }, "Creating new canonical workspace in MongoDB");
        const doc = new Workspace(defaultWorkspace);
        await doc.save();
        workspace = doc.toJSON();
      }
      return workspace;
    }
  } catch (err) {
    logger.error({ userId }, "Failed to fetch/create workspace in Mongo. Falling back to inMemory.", err);
  }

  // Fallback to in-memory DB
  let workspace = inMemoryDB.workspaces?.find(w => String(w.userId) === String(userId));
  if (!workspace) {
    logger.info({ userId }, "Creating new canonical workspace in Memory");
    workspace = { ...defaultWorkspace };
    if (!inMemoryDB.workspaces) inMemoryDB.workspaces = [];
    inMemoryDB.workspaces.push(workspace);
    saveInMemoryDB();
  }

  return workspace;
};

/**
 * Persists the workspace and increments version and updatedAt.
 * @param {string} userId - The user ID
 * @param {Object} workspaceData - The updated workspace object
 */
export const persistWorkspace = async (userId, workspaceData) => {
  workspaceData.version = (workspaceData.version || 0) + 1;
  workspaceData.updatedAt = new Date();

  // Remove _id to prevent Mongo update errors
  const updatePayload = { ...workspaceData };
  delete updatePayload._id;

  try {
    if (isMongoConnected) {
      const updated = await Workspace.findOneAndUpdate(
        { userId },
        { $set: updatePayload },
        { upsert: true, new: true }
      ).lean();
      return updated;
    }
  } catch (err) {
    logger.error({ userId }, "Failed to persist workspace to Mongo. Falling back to inMemory.", err);
  }

  const idx = inMemoryDB.workspaces.findIndex(w => String(w.userId) === String(userId));
  if (idx >= 0) {
    inMemoryDB.workspaces[idx] = workspaceData;
  } else {
    inMemoryDB.workspaces.push(workspaceData);
  }
  saveInMemoryDB();
  return workspaceData;
};
