import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { rewriteBulletsController, atsScoreController, gapRoadmapController } from "../controllers/aiToolsController.js";

const router = express.Router();

// 🔁 Resume bullet rewriter
router.post("/rewrite-bullets", authMiddleware, rewriteBulletsController);

// 📊 ATS Score analysis
router.post("/ats-score", authMiddleware, atsScoreController);

// 🗺️ AI Gap Roadmap
router.post("/gap-roadmap", authMiddleware, gapRoadmapController);

export default router;
