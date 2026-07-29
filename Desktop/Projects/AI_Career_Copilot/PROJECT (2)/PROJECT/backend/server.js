import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dns from "node:dns";

// -----------------------------------------------------------------------------
// Force Node.js to use Cloudflare DNS (fixes SRV lookup issues on some systems)
// -----------------------------------------------------------------------------
dns.setServers([
  "1.1.1.1",
  "1.0.0.1",
]);

console.log("========================================");
console.log("Node DNS Servers:", dns.getServers());
console.log("========================================");

// -----------------------------------------------------------------------------
// Load Environment Variables
// -----------------------------------------------------------------------------
dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

console.log("========================================");
console.log("ENV DEBUG");
console.log("process.cwd():", process.cwd());
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);
console.log("MATCH_ENGINE:", process.env.MATCH_ENGINE);
console.log(
  'OPENROUTER_API_KEY present:',
  !!process.env.OPENROUTER_API_KEY
);

console.log(
  'OPENROUTER_API_KEY length:',
  process.env.OPENROUTER_API_KEY
    ? process.env.OPENROUTER_API_KEY.length
    : 0
);
console.log("========================================");

// -----------------------------------------------------------------------------
// Imports
// -----------------------------------------------------------------------------
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import aiToolsRoutes from "./routes/aiToolsRoutes.js";
import atsDebugRoutes from "./routes/atsDebugRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";

// -----------------------------------------------------------------------------
// Paths
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// Ensure uploads directory exists
// -----------------------------------------------------------------------------
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

// -----------------------------------------------------------------------------
// Express App
// -----------------------------------------------------------------------------
const app = express();

app.use(cors());

app.use(express.json({
  limit: "50mb",
}));

app.use(express.urlencoded({
  limit: "50mb",
  extended: true,
}));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/job-analysis", atsDebugRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/ai", aiToolsRoutes);

app.get("/", (req, res) => {
  res.send("AI Career Copilot API running...");
});

// -----------------------------------------------------------------------------
// Startup
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const MATCH_ENGINE =
  process.env.MATCH_ENGINE || "legacy";

console.log(`MATCH_ENGINE=${MATCH_ENGINE}`);

if (MATCH_ENGINE === "ats") {
  console.log("✅ ATS ENGINE ACTIVE");
} else {
  console.log("⚠️ ATS ENGINE NOT ACTIVE");
}

async function startServer() {
  try {
    console.log("========================================");
    console.log("Starting Database Connection...");
    console.log("========================================");

    await connectDB();

    console.log("========================================");
    console.log("Starting Express Server...");
    console.log("========================================");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup Failed");
    console.error(err);
    process.exit(1);
  }
}

startServer();