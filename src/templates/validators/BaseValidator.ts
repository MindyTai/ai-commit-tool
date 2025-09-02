import { Config } from '../../config';
import { ValidationResult, SUBJECT_MAX_LENGTH } from '../constants';

/**
 * Base validator with common validation logic
 */
export abstract class BaseValidator {
  protected config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  abstract validate(message: string): ValidationResult;

  protected validateBasicStructure(subject: string): string[] {
    const errors: string[] = [];

    if (subject.length > SUBJECT_MAX_LENGTH) {
      errors.push(`Subject line exceeds ${SUBJECT_MAX_LENGTH} characters`);
    }

    if (subject.length === 0) {
      errors.push('Subject line is empty');
    }

    return errors;
  }

  protected getSubjectLine(message: string): string {
    const lines = message.split('\n');
    return lines[0] || '';
  }
}
