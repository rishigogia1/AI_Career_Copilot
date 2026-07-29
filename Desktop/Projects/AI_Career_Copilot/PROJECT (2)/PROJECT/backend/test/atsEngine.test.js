import assert from "assert";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { matchResumeWithJD_ATS } from "../utils/atsEngine.js";

// These tests are integration-style and primarily validate:
// - domain detection returns expected broad bucket
// - match output shape is correct
// - score ranges are reasonable
//
// Note: If OpenAI is unavailable (quota/network), atsEngine falls back/fudges semanticScore,
// but tests should still pass shape checks.

const mlResumeText = `Machine Learning Engineer\n\nSkills: Python, Machine Learning, AI, SQL\nExperience: Built ML models for prediction and classification. Data analysis with pandas.\nEducation: B.Tech Computer Science\nProjects: ML model using TensorFlow and scikit-learn`;

const marketingResumeText = `Marketing Specialist\n\nSkills: SEO, Digital Marketing, Social Media Marketing, Content Creation, Branding, Google Analytics\nExperience: Managed campaigns, lead generation, and content strategy.\nEducation: Bachelor\nProjects: SEO and PPC campaigns`;

const softwareResumeText = `Software Engineer\n\nSkills: JavaScript, React, Node.js, REST API, Git\nExperience: Built web applications and APIs.\nEducation: Bachelor\nProjects: Full-stack app`;

const mlJD = `Machine Learning Engineer\n\nResponsibilities: Build and deploy machine learning models. Work with NLP and computer vision.\nQualifications: 3+ years ML experience, TensorFlow, PyTorch, SQL, Python.`;

const marketingJD = `Marketing Executive\n\nResponsibilities\n- SEO, Digital Marketing, Social Media Marketing, Content Creation\n- Branding, Campaign Management, Lead Generation\n- Google Analytics\n\nQualifications\n- Experience with SEO, PPC/paid media and content creation`;

const runCase = async ({ resumeText, jobDescription, expectedDomainContains }) => {
  const resumeSkills = []; // allow extractor to do work
  const res = await matchResumeWithJD_ATS({ resumeText, resumeSkills, jobDescription });

  assert.ok(typeof res.finalScore === "number", "finalScore should be number");
  assert.ok(Array.isArray(res.matchedSkills), "matchedSkills should be array");
  assert.ok(Array.isArray(res.missingSkills), "missingSkills should be array");
  assert.ok(res.debug, "debug should exist");

  if (expectedDomainContains) {
    assert.ok(
      String(res.debug?.domainDetection?.domainJD?.domain || "").toLowerCase().includes(expectedDomainContains.toLowerCase()),
      `domain should include ${expectedDomainContains}`
    );
  }

  // Basic sanity ranges
  assert.ok(res.finalScore >= 0 && res.finalScore <= 100, "finalScore should be 0-100");
  return res;
};

(async () => {
  // Case 1: ML Resume vs ML JD => high
  await runCase({ resumeText: mlResumeText, jobDescription: mlJD, expectedDomainContains: "Machine" });

  // Case 2: ML Resume vs Marketing JD => low
  const m2 = await runCase({ resumeText: mlResumeText, jobDescription: marketingJD, expectedDomainContains: "Marketing" });
  assert.ok(m2.finalScore <= 50, "ML vs Marketing should not be high");

  // Case 3: Marketing Resume vs Marketing JD => high
  await runCase({ resumeText: marketingResumeText, jobDescription: marketingJD, expectedDomainContains: "Marketing" });

  // Case 4: Software Resume vs ML JD => medium
  const m4 = await runCase({ resumeText: softwareResumeText, jobDescription: mlJD, expectedDomainContains: "Machine" });
  assert.ok(m4.finalScore >= 10, "Software vs ML should not be too low");

  console.log("ATS Engine tests passed");
})();

