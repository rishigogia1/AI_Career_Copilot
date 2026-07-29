/**
 * Structured Logger
 * Replaces console.log to enforce consistent logging formats with Pipeline IDs.
 */
import crypto from 'crypto';

export const generatePipelineId = (prefix = 'ATS') => {
  const shortId = crypto.randomUUID().substring(0, 8).toUpperCase();
  return `[${prefix}-${shortId}]`;
};

class Logger {
  formatMessage(level, context, message) {
    const timestamp = new Date().toISOString();
    const pipelineStr = context?.pipelineId ? ` ${context.pipelineId}` : '';
    const stageStr = context?.stage ? ` [Stage: ${context.stage}]` : '';
    const durationStr = context?.duration ? ` [${context.duration}ms]` : '';
    
    // Stringify context cleanly, omitting the ones we just pulled out
    const cleanContext = { ...context };
    delete cleanContext.pipelineId;
    delete cleanContext.stage;
    delete cleanContext.duration;
    
    const contextStr = Object.keys(cleanContext).length > 0 
      ? ` | Context: ${JSON.stringify(cleanContext)}` 
      : '';

    return `${timestamp} [${level}]${pipelineStr}${stageStr}${durationStr} - ${message}${contextStr}`;
  }

  info(context, message) {
    console.log(this.formatMessage('INFO', context, message));
  }

  warn(context, message) {
    console.warn(this.formatMessage('WARN', context, message));
  }

  error(context, message, error = null) {
    const errorStr = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
    console.error(this.formatMessage('ERROR', context, message) + errorStr);
  }

  debug(context, message) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('DEBUG', context, message));
    }
  }
}

export const logger = new Logger();
