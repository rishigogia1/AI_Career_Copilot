import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { OPENROUTER_MODELS } from "../config/aiConfig.js";

// ── Cooldown tracker: skip models that recently hit quota/rate limits ──
const modelCooldowns = new Map(); // modelKey -> timestamp when cooldown ends
const modelHealth = new Map(); // modelKey -> { successes, failures, lastSuccess, is404, latencies }
const COOLDOWN_MS = 90 * 1000; // 90 seconds before retrying a rate-limited model

const getHealth = (modelKey) => {
  if (!modelHealth.has(modelKey)) {
    modelHealth.set(modelKey, { successes: 0, failures: 0, lastSuccess: 0, is404: false, latencies: [] });
  }
  return modelHealth.get(modelKey);
};

const isInCooldown = (modelKey) => {
  const until = modelCooldowns.get(modelKey);
  return until && Date.now() < until;
};

const setCooldown = (modelKey) => {
  modelCooldowns.set(modelKey, Date.now() + COOLDOWN_MS);
};

export const generateContentWithAI_Robust = async (prompt, modelName = "gemini-2.5-flash") => {
  if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    throw new Error("No AI API key configured (neither GEMINI_API_KEY nor OPENROUTER_API_KEY)");
  }

  const attemptedModels = [];
  const models = [];

  // 1. Try Google SDK natively if GEMINI_API_KEY is defined
  if (process.env.GEMINI_API_KEY) {
    models.push({ type: "native", name: modelName || "gemini-2.5-flash", key: `native:${modelName}` });
  }

  // 2. OpenRouter backups if key is defined
  if (process.env.OPENROUTER_API_KEY) {
    OPENROUTER_MODELS.forEach(m => {
      models.push({ type: "openrouter", name: m, key: `openrouter:${m}` });
    });
  }

  // Skip models in cooldown or 404
  const availableModels = models.filter(m => {
    const health = getHealth(m.key);
    if (health.is404) return false;
    return !isInCooldown(m.key);
  });

  // Sort by highest lastSuccess first
  availableModels.sort((a, b) => {
    return getHealth(b.key).lastSuccess - getHealth(a.key).lastSuccess;
  });

  const modelsToTry = availableModels.length > 0 ? availableModels : models;

  if (availableModels.length === 0 && models.length > 0) {
    console.log("⚠️ All models in cooldown or disabled — trying anyway as last resort");
  }

  let lastError = null;
  let attempts = 0;

  for (const model of modelsToTry) {
    attempts++;
    attemptedModels.push(model.name);
    console.log(`Trying Model ${attempts}:\n${model.name}\n`);

    const startTime = Date.now();
    try {
      let content = "";
      if (model.type === "native") {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelObj = genAI.getGenerativeModel({ model: model.name });
        const result = await modelObj.generateContent(prompt);
        content = result.response.text();
      } else {
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: model.name,
            messages: [{ role: "user", content: prompt }]
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:5000",
              "X-Title": "AI Career Copilot"
            },
            timeout: 25000
          }
        );

        if (response.data?.choices?.[0]?.message?.content) {
          content = response.data.choices[0].message.content;
        } else {
          throw new Error("Empty response choices from OpenRouter");
        }
      }

      // Output Validation
      if (!content || content.trim().length === 0) {
        throw new Error("Received empty response content from AI");
      }

      // Validate JSON formatting and required sections if the prompt requests JSON
      if (prompt.includes("JSON") || prompt.includes("schema")) {
        const cleaned = content.replace(/```json|```/g, "").trim();
        const firstOpen = cleaned.indexOf('{');
        const lastClose = cleaned.lastIndexOf('}');
        if (firstOpen === -1 || lastClose === -1 || lastClose <= firstOpen) {
          throw new Error("Response is not a valid JSON string (braces missing)");
        }
        const parsed = JSON.parse(cleaned.substring(firstOpen, lastClose + 1));

        // Validation check for resume tailoring JSON structure:
        if (prompt.includes("tailoredResume")) {
          if (!parsed.tailoredResume || typeof parsed.tailoredResume !== "string") {
            throw new Error("Validation Failed: Parsed JSON is missing 'tailoredResume' string field");
          }
          if (!Array.isArray(parsed.changesSummary)) {
            throw new Error("Validation Failed: Parsed JSON is missing 'changesSummary' array field");
          }
        }
      }

      console.log("✅ Success\n");
      const h = getHealth(model.key);
      h.successes++;
      h.lastSuccess = Date.now();
      h.latencies.push(Date.now() - startTime);

      return {
        content,
        modelUsed: model.name,
        attempts,
        fallbackUsed: attempts > 1
      };

    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error?.message || err.message || "";
      const lowerMsg = errorMsg.toLowerCase();

      const isAuthError = status === 401 || lowerMsg.includes("api key") || lowerMsg.includes("auth") || lowerMsg.includes("invalid credentials");
      const isBadRequest = status === 400 && (lowerMsg.includes("too large") || lowerMsg.includes("context length") || lowerMsg.includes("missing parameters") || lowerMsg.includes("invalid parameters"));
      const isQuotaErr = status === 429 || status === 402 ||
        lowerMsg.includes("quota") || lowerMsg.includes("credits") ||
        lowerMsg.includes("rate limit") || lowerMsg.includes("per-day") ||
        lowerMsg.includes("per-min") || lowerMsg.includes("payment");

      const h = getHealth(model.key);
      h.failures++;

      if (status === 404) {
        console.log(`❌ Model ${model.name} returned 404. Disabling permanently.`);
        h.is404 = true;
      }

      if (isQuotaErr) {
        setCooldown(model.key);
        console.log(`⏳ Model ${model.name} rate-limited — cooling down for ${COOLDOWN_MS / 1000}s`);
      }

      if (isAuthError || isBadRequest) {
        console.log(`❌ Model ${model.name} failed with unrecoverable error: ${err.message}. Aborting failover loop.`);
        lastError = err;
        break;
      }

      console.log(`❌ Model ${model.name} failed with recoverable error: ${err.message}. Retrying next model...`);
      lastError = err;
    }
  }

  const finalMsg = lastError.response?.data?.error?.message || lastError.message;
  const lastStatus = lastError.response?.status;
  const isQuota = lastStatus === 429 || lastStatus === 402 ||
    finalMsg.includes("quota") || finalMsg.includes("credits") ||
    finalMsg.includes("limit_rpm") || finalMsg.includes("rate limit") ||
    finalMsg.includes("Rate limit") || finalMsg.includes("per-day") ||
    finalMsg.includes("per-min") || finalMsg.includes("Payment");

  const errorObj = new Error(
    isQuota
      ? "All available AI models are currently rate-limited. Please wait a minute and try again."
      : finalMsg
  );
  errorObj.isAIQuotaError = isQuota;
  errorObj.modelsAttempted = attemptedModels;
  errorObj.provider = process.env.GEMINI_API_KEY && attemptedModels[0] === modelName ? "Google/OpenRouter" : "OpenRouter";
  throw errorObj;
};

export const generateContentWithAI = async (prompt, modelName = "gemini-2.5-flash") => {
  const res = await generateContentWithAI_Robust(prompt, modelName);
  return res.content;
};