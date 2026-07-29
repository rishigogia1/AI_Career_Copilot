import { logger } from './logger.js';

export class LLMResponseParser {
  /**
   * Extracts the first JSON object or array from a string.
   */
  static extract(text) {
    if (typeof text !== 'string') return text;
    
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Find the first '{' or '[' and last '}' or ']'
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    
    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIndex = firstBrace;
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
    }
    
    if (startIndex === -1) {
      return cleaned; // Fallback, return as is
    }
    
    const isObject = cleaned[startIndex] === '{';
    const endChar = isObject ? '}' : ']';
    const endIndex = cleaned.lastIndexOf(endChar);
    
    if (endIndex !== -1 && endIndex > startIndex) {
      return cleaned.substring(startIndex, endIndex + 1);
    }
    
    return cleaned;
  }

  /**
   * Repairs common JSON syntax errors from LLMs.
   */
  static repair(text) {
    let repaired = text;
    // Fix trailing commas
    repaired = repaired.replace(/,\s*([\]}])/g, '$1');
    // Fix unescaped control characters (newlines in strings)
    repaired = repaired.replace(/[\u0000-\u001F]+/g, (match) => {
       if (match === '\n') return '\\n';
       if (match === '\r') return '\\r';
       if (match === '\t') return '\\t';
       return ''; // Strip others
    });
    // Fix missing quotes around keys (very basic)
    // repaired = repaired.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    return repaired;
  }

  /**
   * Main entry point to extract, repair, and parse JSON from LLM output.
   * @param {string} rawResponse 
   * @param {Object} context - Optional context for logging (e.g. pipelineId)
   * @param {Object} fallback - Fallback object to return if parsing utterly fails
   */
  static parse(rawResponse, context = {}, fallback = {}) {
    let extracted = this.extract(rawResponse);
    
    try {
      return JSON.parse(extracted);
    } catch (err) {
      logger.warn(context, `Initial JSON parse failed. Attempting repair. Error: ${err.message}`);
      
      let repaired = this.repair(extracted);
      try {
        return JSON.parse(repaired);
      } catch (repairErr) {
        logger.error(context, `Repaired JSON parse failed. Returning fallback. Error: ${repairErr.message}\nRaw Text:\n${rawResponse}`);
        return fallback;
      }
    }
  }
}
