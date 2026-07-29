/**
 * Verifies that the candidate resume preserves basic structure and layout integrity.
 * This validator only rejects candidate resumes that are corrupted or structurally broken.
 */
export const validateResumeIntegrity = ({ originalText, candidateText }) => {
  const reasons = [];
  const warnings = [];
  
  if (!candidateText || candidateText.trim().length < 50) {
    reasons.push("Candidate resume content is empty or extremely short.");
    return { valid: false, reasons, warnings };
  }

  const originalLower = originalText.toLowerCase();
  const candidateLower = candidateText.toLowerCase();

  // 1. Structural Checks: Essential sections must not be completely dropped
  const essentialSections = ["experience", "projects", "education"];
  for (const section of essentialSections) {
    const originalHas = originalLower.includes(section);
    const candidateHas = candidateLower.includes(section);
    if (originalHas && !candidateHas) {
      reasons.push(`Essential section missing: "${section.toUpperCase()}"`);
    }
  }

  // 2. Length Check: Catch extreme context truncation/loss
  const lengthRatio = candidateText.length / originalText.length;
  if (lengthRatio < 0.4) {
    reasons.push(`Candidate resume text is drastically shorter than original (${Math.round(lengthRatio * 100)}% of original length).`);
  }

  // 3. Warning Check: Basic contact detail presence
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailPattern.test(originalText) && !emailPattern.test(candidateText)) {
    warnings.push("Candidate resume might have lost original email contact information.");
  }

  return {
    valid: reasons.length === 0,
    reasons,
    warnings
  };
};