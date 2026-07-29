import express from "express";
import { matchResumeWithJD_ATS } from "../utils/atsEngine.js";

const router = express.Router();

router.get("/debug", async (req, res) => {
  const atsEnabled = (process.env.MATCH_ENGINE || "legacy") === "ats";
  const openaiConfigured = !!process.env.OPENAI_API_KEY;
  const embeddingProvider = openaiConfigured ? "openai" : "none";
  const cacheEnabled = true;
  const extractionMode = openaiConfigured ? "llm+fallback" : "fallback";
  const domainClassificationMode = openaiConfigured ? "llm+heuristic" : "heuristic";

  return res.status(200).json({
    atsEnabled,
    openaiConfigured,
    embeddingProvider,
    cacheEnabled,
    extractionMode,
    domainClassificationMode
  });
});

export default router;

