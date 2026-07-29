import { logger } from './logger.js';

/**
 * assertPipelineContext
 * Validates that all required fields are present in the PipelineContext before execution.
 * Throws an error if validation fails.
 * 
 * @param {Object} context - The PipelineContext object
 * @param {Array<string>} requiredStages - List of required stages (e.g., ['resume', 'jobDescription', 'analysis'])
 */
export const assertPipelineContext = (context, requiredStages = []) => {
  const pipelineId = context?.pipelineId || 'UNKNOWN_PIPELINE';
  
  if (!context) {
    throw new Error('PIPELINE_CONTEXT_MISSING: PipelineContext is undefined or null.');
  }

  const missing = [];

  for (const stage of requiredStages) {
    switch (stage) {
      case 'resume':
        if (!context.resume || !context.resume.rawText || !context.resume.structuredData) {
          missing.push('resume (CanonicalResume)');
        }
        break;
      case 'jobDescription':
        if (!context.jobDescription) {
          missing.push('jobDescription');
        }
        break;
      case 'analysis':
        if (!context.analysis || typeof context.analysis.atsScore !== 'number' || !Array.isArray(context.analysis.matchedSkills)) {
          missing.push('analysis (CanonicalAnalysis)');
        }
        break;
      case 'domain':
        // Ensure Domain Classification ran
        if (context.resume && context.resume.structuredData) {
           // We might check context.analysis.domainResume here or similar depending on where it's stored
        } else {
           missing.push('domain');
        }
        break;
      case 'protectedKeywords':
        if (!context.optimizationPlan || !Array.isArray(context.optimizationPlan.protectedKeywords)) {
          missing.push('protectedKeywords');
        }
        break;
      default:
        break;
    }
  }

  if (missing.length > 0) {
    const errorMsg = `PIPELINE_VALIDATION_FAILED: Missing required context elements: ${missing.join(', ')}`;
    logger.error({ pipelineId, stage: 'ValidationLayer' }, errorMsg);
    throw new Error(errorMsg);
  }

  logger.debug({ pipelineId, stage: 'ValidationLayer' }, `Pipeline context validated successfully for stages: ${requiredStages.join(', ')}`);
  return true;
};
