import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getWorkspaceController,
  saveWorkspaceController,
  resetWorkspaceController
} from "../controllers/workspaceController.js";

const router = express.Router();

// GET  /api/workspace  — Load user's saved workspace on login
router.get("/", authMiddleware, getWorkspaceController);

// PUT  /api/workspace  — Save (upsert) full workspace state
router.put("/", authMiddleware, saveWorkspaceController);

// DELETE /api/workspace — Factory reset workspace
router.delete("/", authMiddleware, resetWorkspaceController);

export default router;
