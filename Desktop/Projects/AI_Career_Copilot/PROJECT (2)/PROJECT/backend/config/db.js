import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "inMemoryDB.json");

/**
 * -----------------------------------------
 * Offline JSON Database Loader
 * -----------------------------------------
 */

const DEFAULT_DB = {
  users: [],
  otps: [],
  resumes: [],
  analyses: [],
  tailoredResumes: [],
  aiSuggestions: [],
  applications: [],
  careerAnalytics: [],
  profiles: [],
  workspaces: [],
};

const loadDB = () => {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);

      console.log(
        `✅ Loaded offline database (Profiles: ${parsed.profiles?.length || 0})`
      );

      return {
        ...DEFAULT_DB,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn(
      "⚠️ Failed to load offline database:",
      err.message
    );
  }

  return { ...DEFAULT_DB };
};

const savedData = loadDB();

/**
 * -----------------------------------------
 * Shared Offline Database
 * -----------------------------------------
 */

export const inMemoryDB = {
  users: savedData.users,
  otps: savedData.otps,
  resumes: savedData.resumes,
  analyses: savedData.analyses,
  tailoredResumes: savedData.tailoredResumes,
  aiSuggestions: savedData.aiSuggestions,
  applications: savedData.applications,
  careerAnalytics: savedData.careerAnalytics,
  profiles: savedData.profiles,
  workspaces: savedData.workspaces,
};

/**
 * -----------------------------------------
 * Save Offline Database
 * -----------------------------------------
 */

export const saveInMemoryDB = () => {
  try {
    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify(inMemoryDB, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn(
      "⚠️ Failed to save offline database:",
      err.message
    );
  }
};

/**
 * -----------------------------------------
 * MongoDB Connection Status
 * -----------------------------------------
 */

export let isMongoConnected = false;

/**
 * -----------------------------------------
 * MongoDB Connection
 * -----------------------------------------
 */

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("✅ MongoDB already connected.");
      isMongoConnected = true;
      return;
    }

    mongoose.set("bufferCommands", false);
    console.log("URI:", process.env.MONGO_URI);

   const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
});

    isMongoConnected = true;

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}`
    );
  } catch (error) {
    isMongoConnected = false;

    console.warn(
      `⚠️ MongoDB Connection Failed: ${error.message}`
    );

    try {
      await mongoose.disconnect();
    } catch (_) {}

    console.warn(
      "🚀 Falling back to persistent offline JSON database."
    );
  }
};

/**
 * -----------------------------------------
 * Connection Events
 * -----------------------------------------
 */

mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
  console.warn("⚠️ MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  isMongoConnected = true;
  console.log("✅ MongoDB reconnected.");
});

mongoose.connection.on("error", (err) => {
  isMongoConnected = false;
  console.warn("⚠️ MongoDB connection error:", err.message);
});

/**
 * -----------------------------------------
 * Export
 * -----------------------------------------
 */

export default connectDB;