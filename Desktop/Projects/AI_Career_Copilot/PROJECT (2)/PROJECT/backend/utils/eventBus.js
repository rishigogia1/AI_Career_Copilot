/**
 * EventBus - Simple Pub/Sub for the Event-Driven Pipeline
 */
import { logger } from './logger.js';

class EventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g., 'ResumeUploaded')
   * @param {Function} callback - Async callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Publish an event
   * @param {string} event - Event name
   * @param {Object} payload - PipelineContext or other payload
   */
  async publish(event, payload) {
    const pipelineId = payload?.pipelineId || 'UNKNOWN_PIPELINE';
    logger.debug({ pipelineId, stage: 'EventBus' }, `Publishing event: ${event}`);

    if (!this.listeners[event] || this.listeners[event].length === 0) {
      logger.debug({ pipelineId, stage: 'EventBus' }, `No listeners for event: ${event}`);
      return;
    }

    // Execute all listeners concurrently
    const promises = this.listeners[event].map(async (callback) => {
      try {
        await callback(payload);
      } catch (err) {
        logger.error({ pipelineId, stage: 'EventBus' }, `Error in listener for event ${event}`, err);
      }
    });

    await Promise.all(promises);
  }
}

export const eventBus = new EventBus();

// Defined Pipeline Events
export const PipelineEvents = {
  RESUME_UPLOADED: 'ResumeUploaded',
  RESUME_PARSED: 'ResumeParsed',
  DOMAIN_CLASSIFIED: 'DomainClassified',
  ANALYSIS_CREATED: 'AnalysisCreated',
  WORKSPACE_SAVED: 'WorkspaceSaved',
  TAILOR_READY: 'TailorReady',
  SUGGESTIONS_READY: 'SuggestionsReady',
  INTERVIEW_READY: 'InterviewReady'
};
