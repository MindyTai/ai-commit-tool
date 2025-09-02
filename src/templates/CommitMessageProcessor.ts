import { Config } from '../config';
import { ValidationResult } from './constants';
import { MessageSanitizer } from './MessageSanitizer';
import { ValidatorFactory } from './validators/ValidatorFactory';
import { FormatterFactory } from './formatters/FormatterFactory';

/**
 * Main processor that orchestrates message formatting and validation
 * Follows Single Responsibility Principle by delegating to specialized classes
 */
export class CommitMessageProcessor {
  private sanitizer: MessageSanitizer;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.sanitizer = new MessageSanitizer();
  }

  /**
   * Formats a raw commit message according to the configured style
   */
  format(rawMessage: string): string {
    const sanitizedMessage = this.sanitizer.sanitize(rawMessage);
    const lines = this.sanitizer.parseLines(sanitizedMessage);
    
    if (lines.length === 0) {
      throw new Error('Generated message is empty');
    }
    
    const firstLine = lines[0];
    const body = lines.length > 1 ? lines.slice(1).join('\n').trim() : undefined;
    
    const formatter = FormatterFactory.create(this.config);
    return formatter.format(firstLine, body);
  }

  /**
   * Validates a commit message according to the configured style
   */
  validate(message: string): ValidationResult {
    const validator = ValidatorFactory.create(this.config);
    return validator.validate(message);
  }
}
