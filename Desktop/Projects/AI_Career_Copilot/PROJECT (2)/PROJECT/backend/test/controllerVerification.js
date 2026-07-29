import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const { matchJobController_ATS } = await import("../controllers/atsJobController.js");

const mockRequest = (jdText) => ({
  body: {
    resumeText: "Mechanical Engineer with AutoCAD and SolidWorks experience.",
    resumeSkills: ["autocad"],
    jobDescription: jdText
  },
  user: { id: "test-user-id" }
});

const mockResponse = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const runTest = async (jdText) => {
  const req = mockRequest(jdText);
  const res = mockResponse();
  await matchJobController_ATS(req, res);
  return res.body;
};

(async () => {
  console.log("=== RUNNING ATS ROLE EXTRACTION TEST ===");
  
  // Test case 1: Mechanical Design JD
  const jdMech = "Mechanical Design Engineer\nWe need someone with AutoCAD and SolidWorks.";
  const res1 = await runTest(jdMech);
  console.log("Mech JD ->", res1?.message || res1?.error || res1);
  
  // Test case 2: ML JD
  const jdML = "Machine Learning Engineer\nQualifications: Python, TensorFlow.";
  const res2 = await runTest(jdML);
  console.log("ML JD ->", res2?.message || res2?.error || res2);

  // Test case 3: Marketing JD
  const jdMkt = "Marketing Executive\nResponsibilities: SEO campaigns.";
  const res3 = await runTest(jdMkt);
  console.log("Marketing JD ->", res3?.message || res3?.error || res3);
})();
