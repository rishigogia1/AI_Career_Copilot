import assert from "assert";
import axios from "axios";
import { generateContentWithAI_Robust } from "../utils/geminiClient.js";

// Helper to mock axios.post
const mockAxiosPost = (implementation) => {
  axios.post = implementation;
};

// Back up original axios.post
const originalPost = axios.post;

console.log("================= RUNNING AI FAILOVER UNIT TESTS =================");

const runTests = async () => {
  // Setup standard env mock
  process.env.OPENROUTER_API_KEY = "mock-openrouter-key";
  delete process.env.GEMINI_API_KEY; // Only use OpenRouter flow to test sequential failovers

  try {
    // -------------------------------------------------------------
    // Test 1: Primary model succeeds on first attempt
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Primary model success ---");
    mockAxiosPost(async (url, data, config) => {
      return {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tailoredResume: "Tailored Content",
                  changesSummary: ["Did change"],
                  reasoning: "Matched skills"
                })
              }
            }
          ]
        }
      };
    });

    const res1 = await generateContentWithAI_Robust("Please return JSON for tailoredResume");
    assert.strictEqual(res1.attempts, 1);
    assert.strictEqual(res1.fallbackUsed, false);
    assert.strictEqual(res1.modelUsed, "google/gemini-2.5-flash");
    console.log("✅ TEST 1 PASSED");

    // -------------------------------------------------------------
    // Test 2: First model rate limited (429), second model succeeds
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: First model rate limited (429) -> Second succeeds ---");
    let test2Calls = 0;
    mockAxiosPost(async (url, data, config) => {
      test2Calls++;
      if (test2Calls === 1) {
        const err = new Error("Rate limit exceeded");
        err.response = { status: 429, data: { error: { message: "Rate limit exceeded" } } };
        throw err;
      }
      return {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tailoredResume: "Tailored Content 2",
                  changesSummary: ["Changed 2"],
                  reasoning: "Fallback ok"
                })
              }
            }
          ]
        }
      };
    });

    const res2 = await generateContentWithAI_Robust("Please return JSON for tailoredResume");
    assert.strictEqual(res2.attempts, 2);
    assert.strictEqual(res2.fallbackUsed, true);
    assert.strictEqual(res2.modelUsed, "meta-llama/llama-3.3-70b-instruct:free");
    console.log("✅ TEST 2 PASSED");

    // -------------------------------------------------------------
    // Test 3: Unrecoverable error (401 Auth) aborts failover immediately
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Unrecoverable error (401 Auth) aborts failover ---");
    let test3Calls = 0;
    mockAxiosPost(async (url, data, config) => {
      test3Calls++;
      const err = new Error("Invalid API Key");
      err.response = { status: 401, data: { error: { message: "Invalid API Key" } } };
      throw err;
    });

    try {
      await generateContentWithAI_Robust("Please return JSON for tailoredResume");
      assert.fail("Should have thrown an unrecoverable error");
    } catch (err) {
      assert.strictEqual(test3Calls, 1); // Aborts after 1 attempt
      assert.strictEqual(err.message.includes("Invalid API Key"), true);
      console.log("✅ TEST 3 PASSED");
    }

    // -------------------------------------------------------------
    // Test 4: JSON Validation Failure -> Tries next model
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: JSON Validation Failure -> Tries next model ---");
    let test4Calls = 0;
    mockAxiosPost(async (url, data, config) => {
      test4Calls++;
      if (test4Calls === 1) {
        // Return invalid JSON structure (braces missing)
        return { data: { choices: [{ message: { content: "Plain text that is not JSON" } }] } };
      }
      return {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  tailoredResume: "Validated Content",
                  changesSummary: ["Passed validation"],
                  reasoning: "Parsed ok"
                })
              }
            }
          ]
        }
      };
    });

    const res4 = await generateContentWithAI_Robust("Please return JSON for tailoredResume");
    assert.strictEqual(res4.attempts, 2);
    assert.strictEqual(res4.fallbackUsed, true);
    assert.strictEqual(res4.modelUsed, "meta-llama/llama-3.3-70b-instruct:free");
    console.log("✅ TEST 4 PASSED");

    // -------------------------------------------------------------
    // Test 5: All models rate limited -> Quota Exceeded error
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: All models rate limited -> Quota Exceeded ---");
    mockAxiosPost(async (url, data, config) => {
      const err = new Error("Quota exceeded");
      err.response = { status: 429, data: { error: { message: "Quota limit reached" } } };
      throw err;
    });

    try {
      await generateContentWithAI_Robust("Please return JSON for tailoredResume");
      assert.fail("Should have failed after cycling all models");
    } catch (err) {
      assert.strictEqual(err.isAIQuotaError, true);
      assert.strictEqual(err.modelsAttempted.length > 2, true); // Multiple models tried
      console.log("✅ TEST 5 PASSED");
    }

  } catch (error) {
    console.error("❌ UNIT TEST SUITE FAILED:");
    console.error(error);
    process.exit(1);
  } finally {
    // Restore original axios
    axios.post = originalPost;
  }

  console.log("\n================= ALL UNIT TESTS PASSED SUCCESSFULLY ===============");
};

runTests();
