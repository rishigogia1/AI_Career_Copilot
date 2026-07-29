/**
 * Merges partial modifications from the AI response into the original resume text.
 */
export const mergeResumeDiff = (originalText, diff, resumeJSON = null) => {
  let tailoredText = originalText;

  // Helper to replace section/text content case-insensitively and robustly
  const replaceContent = (targetKeyword, newContent) => {
    if (!newContent) return;
    const lowerText = tailoredText.toLowerCase();
    const index = lowerText.indexOf(targetKeyword.toLowerCase());
    if (index !== -1) {
      // Find where next section might start
      const headers = [
        "professional summary",
        "technical skills",
        "experience",
        "projects",
        "education",
        "certifications",
        "achievements",
        "relevant coursework",
        "soft skills",
        "github projects"
      ];
      let nextIndex = tailoredText.length;
      for (const h of headers) {
        if (h.toLowerCase() === targetKeyword.toLowerCase()) continue;
        const hIdx = lowerText.indexOf(h);
        if (hIdx > index && hIdx < nextIndex) {
          nextIndex = hIdx;
        }
      }
      tailoredText = tailoredText.substring(0, index) + targetKeyword + "\n" + newContent + "\n\n" + tailoredText.substring(nextIndex);
    }
  };

  // Extract all project titles to use as boundaries
  const projectTitles = [];
  if (resumeJSON && resumeJSON.projects) {
    const lines = resumeJSON.projects.split("\n").map(l => l.trim()).filter(Boolean);
    const ignoreList = ["projects", "project", "tech stack", "description", "features"];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (ignoreList.some(ig => lower === ig) || line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
        continue;
      }
      if (line.startsWith("--") && line.endsWith("--")) {
        continue;
      }
      projectTitles.push(line);
    }
  }
  if (Array.isArray(diff.modifiedProjects)) {
    for (const proj of diff.modifiedProjects) {
      if (proj.title && !projectTitles.some(t => t.toLowerCase() === proj.title.toLowerCase())) {
        projectTitles.push(proj.title);
      }
    }
  }

  // Extract all experience companies/roles to use as boundaries
  const experienceTitles = [];
  if (resumeJSON && resumeJSON.experience) {
    const lines = resumeJSON.experience.split("\n").map(l => l.trim()).filter(Boolean);
    const ignoreList = ["experience", "work experience", "internship", "description", "responsibilities", "key responsibilities"];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (ignoreList.some(ig => lower === ig) || line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
        continue;
      }
      if (line.startsWith("--") && line.endsWith("--")) {
        continue;
      }
      experienceTitles.push(line);
    }
  }
  if (Array.isArray(diff.modifiedExperience)) {
    for (const exp of diff.modifiedExperience) {
      if (exp.company && !experienceTitles.some(t => t.toLowerCase() === exp.company.toLowerCase())) {
        experienceTitles.push(exp.company);
      }
      if (exp.role && !experienceTitles.some(t => t.toLowerCase() === exp.role.toLowerCase())) {
        experienceTitles.push(exp.role);
      }
    }
  }

  // 1. Merge Professional Summary
  if (diff.professionalSummary) {
    replaceContent("PROFESSIONAL SUMMARY", diff.professionalSummary);
  }

  // 2. Merge Skills
  if (diff.skills && diff.skills.length > 0) {
    const formattedSkills = diff.skills.join(", ");
    replaceContent("TECHNICAL SKILLS", formattedSkills);
  }

  // 3. Merge Projects
  if (Array.isArray(diff.modifiedProjects)) {
    for (const proj of diff.modifiedProjects) {
      if (!proj.title || !proj.description) continue;
      const projIdx = tailoredText.toLowerCase().indexOf(proj.title.toLowerCase());
      if (projIdx !== -1) {
        let nextMarker = tailoredText.length;
        const markers = [
          "professional summary",
          "technical skills",
          "experience",
          "projects",
          "education",
          "certifications",
          "achievements",
          "relevant coursework",
          "soft skills",
          "github projects"
        ];
        for (const m of markers) {
          const mIdx = tailoredText.toLowerCase().indexOf(m);
          if (mIdx > projIdx && mIdx < nextMarker) {
            nextMarker = mIdx;
          }
        }
        
        // Use other project titles as boundaries
        for (const t of projectTitles) {
          if (t.toLowerCase() === proj.title.toLowerCase()) continue;
          const tIdx = tailoredText.toLowerCase().indexOf(t.toLowerCase());
          if (tIdx > projIdx && tIdx < nextMarker) {
            nextMarker = tIdx;
          }
        }

        // Also check if there's another bullet point / heading that might indicate a next item
        const afterProj = tailoredText.substring(projIdx + proj.title.length);
        const nextBulletIdx = afterProj.indexOf("\n\n");
        if (nextBulletIdx !== -1 && (projIdx + proj.title.length + nextBulletIdx) < nextMarker) {
          nextMarker = projIdx + proj.title.length + nextBulletIdx;
        }

        tailoredText = tailoredText.substring(0, projIdx) + proj.title + "\n" + proj.description + "\n\n" + tailoredText.substring(nextMarker);
      }
    }
  }

  // 4. Merge Experience
  if (Array.isArray(diff.modifiedExperience)) {
    for (const exp of diff.modifiedExperience) {
      const query = exp.company || exp.role;
      if (!query || !exp.description) continue;
      const expIdx = tailoredText.toLowerCase().indexOf(query.toLowerCase());
      if (expIdx !== -1) {
        let nextMarker = tailoredText.length;
        const markers = [
          "professional summary",
          "technical skills",
          "experience",
          "projects",
          "education",
          "certifications",
          "achievements",
          "relevant coursework",
          "soft skills",
          "github projects"
        ];
        for (const m of markers) {
          const mIdx = tailoredText.toLowerCase().indexOf(m);
          if (mIdx > expIdx && mIdx < nextMarker) {
            nextMarker = mIdx;
          }
        }

        // Use other experience titles as boundaries
        for (const t of experienceTitles) {
          if (t.toLowerCase() === query.toLowerCase()) continue;
          const tIdx = tailoredText.toLowerCase().indexOf(t.toLowerCase());
          if (tIdx > expIdx && tIdx < nextMarker) {
            nextMarker = tIdx;
          }
        }

        const afterExp = tailoredText.substring(expIdx + query.length);
        const nextBulletIdx = afterExp.indexOf("\n\n");
        if (nextBulletIdx !== -1 && (expIdx + query.length + nextBulletIdx) < nextMarker) {
          nextMarker = expIdx + query.length + nextBulletIdx;
        }

        tailoredText = tailoredText.substring(0, expIdx) + query + "\n" + exp.description + "\n\n" + tailoredText.substring(nextMarker);
      }
    }
  }

  return tailoredText.trim();
};
