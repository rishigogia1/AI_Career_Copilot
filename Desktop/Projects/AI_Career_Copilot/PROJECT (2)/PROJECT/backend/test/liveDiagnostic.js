import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { generateContentWithAI_Robust } from "../utils/geminiClient.js";

const testPrompt = `Return ONLY this JSON:
{
  "tailoredResume": "Test resume content",
  "changesSummary": ["Test change"],
  "reasoning": "Test reasoning"
}`;

console.log("=== LIVE FAILOVER DIAGNOSTIC ===");
console.log("GEMINI_API_KEY set:", !!process.env.GEMINI_API_KEY);
console.log("OPENROUTER_API_KEY set:", !!process.env.OPENROUTER_API_KEY);
console.log("");

try {
  const result = await generateContentWithAI_Robust(testPrompt, "gemini-2.5-flash");
  console.log("✅ SUCCESS");
  console.log("  modelUsed:", result.modelUsed);
  console.log("  fallbackUsed:", result.fallbackUsed);
  console.log("  attempts:", result.attempts);
  console.log("  content (first 200):", result.content.substring(0, 200));
} catch (err) {
  console.log("❌ ALL MODELS FAILED");
  console.log("  Final error message:", err.message);
  console.log("  isAIQuotaError:", err.isAIQuotaError);
  console.log("  modelsAttempted:", err.modelsAttempted);
  console.log("  provider:", err.provider);
  if (err.response?.data) {
    console.log("  raw API response:", JSON.stringify(err.response.data, null, 2));
  }
}
