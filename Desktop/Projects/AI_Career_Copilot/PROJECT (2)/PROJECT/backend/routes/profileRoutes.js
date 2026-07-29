import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getProfileController,
  updateProfileController,
  updateNameController,
  changePasswordController,
  uploadAvatarController,
  deleteAccountController,
} from "../controllers/profileController.js";

const router = express.Router();

// All routes are protected
router.get("/", authMiddleware, getProfileController);
router.put("/", authMiddleware, updateProfileController);
router.put("/name", authMiddleware, updateNameController);
router.put("/password", authMiddleware, changePasswordController);
router.post("/avatar", authMiddleware, upload.single("avatar"), uploadAvatarController);
router.delete("/", authMiddleware, deleteAccountController);

export default router;
