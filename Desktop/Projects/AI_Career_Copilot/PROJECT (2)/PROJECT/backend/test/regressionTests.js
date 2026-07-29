import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

import assert from "assert";

const { matchResumeWithJD_ATS } = await import("../utils/atsEngine.js");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Resumes
const mechanicalResumeText = `
John Doe
Mechanical Engineer
Email: john@example.com
Phone: +1-555-0199
Address: 123 Main St, Detroit, MI
Date: 2020 - 2024

EDUCATION
Bachelor of Science in Mechanical Engineering

SKILLS
Mechanical Engineering, AutoCAD, SolidWorks, CATIA, ANSYS, MATLAB, Manufacturing Processes, Thermodynamics, Quality Control, CNC Programming, Product Design, Machine Design, Root Cause Analysis, Material Selection, Communication

EXPERIENCE
Mechanical Engineering Internship | TechCorp (June 2023 - Present)
- Developed and optimized manufacturing processes and performed quality control.
- Utilized AutoCAD and SolidWorks for component CAD modeling.
- Involved in machine design and product design validation.
- Performed root cause analysis on mechanical system failures.

PROJECTS
Mechanical Design Project
- Designed gearbox assembly using SolidWorks and CATIA.
Gearbox Design Project
- Performed stress analysis and finite element analysis (FEA) on gear teeth using ANSYS.
- Assisted with material selection for gear components.
SAE BAJA Project
- Part of SAE BAJA team. Supported frame design and validation.
`;

const mlResumeText = `
Jane Doe
Machine Learning Engineer
Email: jane@example.com

EDUCATION
Master of Science in Computer Science

SKILLS
Python, Machine Learning, TensorFlow, PyTorch, SQL, Natural Language Processing (NLP), Computer Vision, Deep Learning, Pandas, NumPy

EXPERIENCE
Machine Learning Intern | AI Solutions (2022 - Present)
- Built and trained neural networks for image classification and CNN models.
- Deployed LLMs for text generation and processing.
- Optimized model performance and scalability.

PROJECTS
Text Generation Project
- Built GPT-based conversational agent and text generation project using PyTorch.
Image Recognition App
- Developed CNN image recognition app using TensorFlow.
`;

const marketingResumeText = `
Bob Smith
Marketing Manager
Email: bob@example.com

EDUCATION
Bachelor of Business Administration in Marketing

SKILLS
SEO, Digital Marketing, Social Media Marketing, Content Creation, Branding, Campaign Management, Lead Generation, Google Analytics, Market Research, Communication

EXPERIENCE
Marketing Coordinator | BrandsInc (2021 - Present)
- Executed SEO and digital marketing campaigns resulting in 20% growth.
- Ran lead generation campaigns and analyzed Google Analytics.
- Developed content creation and branding strategy.

PROJECTS
Launch Campaign
- Managed end-to-end launch of new software products using digital marketing campaigns.
`;

// Job Descriptions
const mechanicalJD = `
Mechanical Design Engineer

EDUCATION
Bachelor in Mechanical Engineering or related field.

EXPERIENCE
- 3+ years of experience in design validation, machine design, product design, and root cause analysis of mechanical systems.
- Experience with manufacturing processes and quality control using MATLAB.
- Performing stress analysis and finite element analysis (FEA) using ANSYS.

PROJECTS
- Participation in SAE BAJA project or gearbox design projects.
- Hands-on experience with CAD modeling and engineering drawings using AutoCAD, SolidWorks, and CATIA.

Requirements:
- Strong skills in Mechanical Engineering, CAD Modeling, AutoCAD, SolidWorks, CATIA, ANSYS, FEA, MATLAB, Quality Control, Manufacturing Processes, and Material Selection.
- Good communication.
`;

const mlJD = `
Machine Learning Engineer

EDUCATION
Bachelor or Master in Computer Science or related fields.

EXPERIENCE
- Build and deploy scalable machine learning models and neural networks.
- Core proficiency in Python, TensorFlow, PyTorch, and SQL.
- Working experience with NLP, text generation, and computer vision models.

PROJECTS
- Experience with deep learning frameworks, CNN models, and model optimization.
`;

const marketingJD = `
Marketing Executive

EDUCATION
Degree in Marketing or Communications.

EXPERIENCE
- Execute digital marketing campaigns, SEO, Social Media Marketing, and content creation.
- Focus on branding, campaign management, and lead generation.
- Proficient in Google Analytics and market research.

PROJECTS
- Managing digital marketing and paid ad campaigns for new products.
`;

const runCase = async (caseName, resumeText, jdText, minScore, maxScore) => {
  console.log(`\n==================================================`);
  console.log(`RUNNING REGRESSION: ${caseName}`);
  console.log(`==================================================`);
  
  const result = await matchResumeWithJD_ATS({
    resumeText,
    resumeSkills: [],
    jobDescription: jdText
  });
  
  console.log(`-> Resulting Final Score: ${result.finalScore}% (Expected range: ${minScore}% - ${maxScore}%)`);
  
  assert.ok(
    result.finalScore >= minScore && result.finalScore <= maxScore,
    `FAIL: ${caseName} score of ${result.finalScore}% was outside expected range ${minScore}%-${maxScore}%`
  );
  console.log(`PASS: ${caseName}`);
  return result;
};

(async () => {
  try {
    // CASE 1: Mechanical Resume vs Mechanical JD => Expected: 70–85
    await runCase("CASE 1: Mechanical Resume vs Mechanical JD", mechanicalResumeText, mechanicalJD, 70, 85);
    await sleep(15000);
    
    // CASE 2: Mechanical Resume vs ML JD => Expected: 10–35
    await runCase("CASE 2: Mechanical Resume vs ML JD", mechanicalResumeText, mlJD, 10, 35);
    await sleep(15000);
    
    // CASE 3: Marketing Resume vs Marketing JD => Expected: 70–85
    await runCase("CASE 3: Marketing Resume vs Marketing JD", marketingResumeText, marketingJD, 70, 85);
    await sleep(15000);
    
    // CASE 4: Marketing Resume vs ML JD => Expected: 10–35
    await runCase("CASE 4: Marketing Resume vs ML JD", marketingResumeText, mlJD, 10, 35);
    await sleep(15000);
    
    // CASE 5: ML Resume vs ML JD => Expected: 70–90
    await runCase("CASE 5: ML Resume vs ML JD", mlResumeText, mlJD, 70, 90);
    
    console.log("\nALL ATS REGRESSION TEST CASES PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("\nREGRESSION RUN FAILED:");
    console.error(err);
    process.exit(1);
  }
})();
