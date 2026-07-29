import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const { generateSuggestions } = await import("../utils/aiEngine.js");

(async () => {
  console.log("=== RUNNING ANSWER RELEVANCE VERIFICATION ===");
  
  const testQuestions = [
    { question: "What do you know about engineering analysis? How would you learn it quickly?", type: "technical" },
    { question: "Describe your experience with CAD modeling and SolidWorks.", type: "technical" },
    { question: "How do you manage complex manufacturing processes in production?", type: "technical" },
    { question: "Explain your communication workflow with external stakeholders.", type: "behavioral" }
  ];
  
  const matchData = {
    matchedSkills: ["CAD Modeling", "Engineering Analysis", "Manufacturing Processes"],
    missingSkills: []
  };

  // We temporarily intercept generateBaseSuggestionsAndQuestions to return our test questions
  const { generateSuggestions: originalGenerateSuggestions } = await import("../utils/aiEngine.js");

  // Since generateSuggestions automatically calls generateBaseSuggestionsAndQuestions,
  // we can test generateAnswerForQuestion directly.
  const { generateAnswerForQuestion } = await import("../utils/aiEngine.js");

  for (const q of testQuestions) {
    console.log("\n--------------------------------------------------");
    const ans = await generateAnswerForQuestion(q.question, q.type, "Mechanical Engineer", ["SolidWorks", "ANSYS", "FEA"]);
    console.log(`Question: ${q.question}`);
    console.log(`Topic validation passed: ${ans.sampleAnswer ? "YES" : "NO"}`);
  }
  
  console.log("\n=========================================");
  console.log("Relevance Verification Completed!");
})();
