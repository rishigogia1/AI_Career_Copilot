export const extractResumeData = (text) => {

  const lowerText = text.toLowerCase();

  // 🔹 Skill Detection (can be expanded anytime)
  const skillsList = [
    "java", "python", "c++", "javascript", "react", "node", "mongodb",
    "sql", "html", "css", "machine learning", "ai", "data science",
    "numpy", "pandas", "matplotlib", "scikit-learn",
    "mechanical engineering", "autocad", "solidworks", "catia", "ansys", "matlab",
    "manufacturing processes", "thermodynamics", "fluid mechanics", "cnc programming",
    "quality control", "machine design", "product design", "cad modeling", "design validation",
    "root cause analysis", "material selection", "production engineering", "fea", "sae baja"
  ];

  const skills = skillsList.filter(skill => lowerText.includes(skill));

  // 🔹 Section Keywords Mapping
  const sectionMap = {
    education: ["education", "academic"],
    projects: ["project", "project experience"],
    experience: ["experience", "work experience", "internship"]
  };

  // 🔹 Find section positions
  let positions = [];

  for (let key in sectionMap) {
    for (let keyword of sectionMap[key]) {
      const index = lowerText.indexOf(keyword);
      if (index !== -1) {
        positions.push({ section: key, index });
      }
    }
  }

  // 🔹 Sort sections by appearance
  positions.sort((a, b) => a.index - b.index);

  // 🔹 Extract sections dynamically
  let sections = {
    education: "",
    projects: "",
    experience: ""
  };

  for (let i = 0; i < positions.length; i++) {
    const current = positions[i];
    const next = positions[i + 1];

    const start = current.index;
    const end = next ? next.index : text.length;

    sections[current.section] = text.substring(start, end).trim();
  }

  // 🔹 Clean unwanted content
  const cleanSection = (sectionText) => {
    if (!sectionText) return "";

    const stopWords = [
      "certifications",
      "areas of interest",
      "technical skills",
      "skills",
      "tools"
    ];

    let cleaned = sectionText;

    for (let word of stopWords) {
      const index = cleaned.toLowerCase().indexOf(word);
      if (index !== -1) {
        cleaned = cleaned.substring(0, index);
      }
    }

    return cleaned.trim();
  };

  return {
    skills,
    education: cleanSection(sections.education),
    projects: cleanSection(sections.projects),
    experience: cleanSection(sections.experience)
  };
};