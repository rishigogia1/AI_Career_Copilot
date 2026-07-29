import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const { matchResumeWithJD_ATS } = await import("../utils/atsEngine.js");

const resumeText = `
John Doe
Mechanical Engineer
Email: john@example.com
Phone: +1-555-0199
Address: 123 Main St, Detroit, MI
Date: 2020 - 2024

EDUCATION
Bachelor of Science in Mechanical Engineering

SKILLS
Mechanical Engineering, AutoCAD, SolidWorks, CATIA, ANSYS, MATLAB, Manufacturing Processes, Thermodynamics, Quality Control, CNC Programming, Product Design, Machine Design

EXPERIENCE
Mechanical Engineering Internship | TechCorp (June 2023 - Present)
- Developed and optimized manufacturing processes and performed quality control.
- Utilized AutoCAD and SolidWorks for component CAD modeling.
- Involved in machine design and product design validation.

PROJECTS
Mechanical Design Project
- Designed gearbox assembly using SolidWorks and CATIA.
Gearbox Design Project
- Performed stress analysis and finite element analysis (FEA) on gear teeth using ANSYS.
SAE BAJA Project
- Part of SAE BAJA team. Supported frame design and validation.
`;

const jdText = `
Mechanical Design Engineer

EDUCATION
Bachelor in Mechanical Engineering or related field.

EXPERIENCE
- 3+ years of experience in design validation, machine design, product design, and root cause analysis of mechanical systems.
- Experience with manufacturing processes and quality control using MATLAB.
- Performing stress analysis and finite element analysis (FEA) using ANSYS.

PROJECTS
- Participation in SAE BAJA project or similar gearbox design projects.
- Hands-on experience with CAD modeling and engineering drawings using AutoCAD, SolidWorks, and CATIA.

Requirements:
- Strong skills in Mechanical Engineering, CAD Modeling, ANSYS, FEA, and Material Selection.
- Good communication.
`;

(async () => {
  console.log("=== RUNNING MECHANICAL ATS SCORE VERIFICATION ===");
  const result = await matchResumeWithJD_ATS({
    resumeText,
    resumeSkills: [],
    jobDescription: jdText
  });
  console.log("=================================================");
  console.log("Verification Result:");
  console.log("Final ATS Score:", result.finalScore);
  console.log("Matched Skills:", result.matchedSkills);
  console.log("Missing Skills:", result.missingSkills);
})();
