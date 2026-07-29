import express from "express";
import { matchJobController, getAnalysisHistory } from "../controllers/jobController.js";
import { matchJobController_ATS, matchJobDetailedController_ATS, matchJobSuggestionsController_ATS } from "../controllers/atsJobController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Engine switch (legacy vs ats)
const ENGINE = process.env.MATCH_ENGINE || "legacy";
router.post("/match", authMiddleware, ENGINE === "ats" ? matchJobController_ATS : matchJobController);
router.post("/match/detailed", authMiddleware, matchJobDetailedController_ATS);
router.post("/match/suggestions", authMiddleware, matchJobSuggestionsController_ATS);

// GET history for frontend
router.get("/history", authMiddleware, getAnalysisHistory);

export default router;
