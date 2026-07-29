import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadResumeController, tailorResumeController } from "../controllers/resumeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("resume"), uploadResumeController);
router.post("/tailor", authMiddleware, tailorResumeController);

export default router;