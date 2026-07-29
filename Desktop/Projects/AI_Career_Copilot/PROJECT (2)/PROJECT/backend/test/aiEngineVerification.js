import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const { generateSuggestions } = await import("../utils/aiEngine.js");

(async () => {
  console.log("=== RUNNING AI ENGINE SUGGESTIONS TEST ===");
  
  const matchData = {
    matchedSkills: ["Machine Learning", "Communication"],
    missingSkills: ["NLP", "Teamwork"]
  };
  
  const result = await generateSuggestions(matchData);
  
  console.log("=========================================");
  console.log("Suggestions:", result.suggestions);
  console.log("=========================================");
  
  console.log("Technical Questions & Guidance:");
  result.questions.technical.forEach((q, idx) => {
    console.log(`\nQ${idx + 1}: ${q.question}`);
    console.log(`Guidance: ${q.answer}`);
  });
  
  console.log("\n=========================================");
  console.log("Behavioral Questions & Guidance:");
  result.questions.behavioral.forEach((q, idx) => {
    console.log(`\nB${idx + 1}: ${q.question}`);
    console.log(`Guidance: ${q.answer}`);
  });
})();
