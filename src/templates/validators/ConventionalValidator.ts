import { BaseValidator } from './BaseValidator';
import { ValidationResult, CONVENTIONAL_REGEX } from '../constants';

/**
 * Validates conventional commit format
 */
export class ConventionalValidator extends BaseValidator {
  validate(message: string): ValidationResult {
    const subject = this.getSubjectLine(message);
    const errors = this.validateBasicStructure(subject);

    // Check conventional commits format
    if (!CONVENTIONAL_REGEX.test(subject)) {
      errors.push('Subject line does not follow Conventional Commits format');
    }

    // Check for proper capitalization after colon
    const match = subject.match(/^[^:]+: (.)/);
    if (match && match[1] !== match[1].toLowerCase()) {
      errors.push('Description should start with lowercase letter');
    }

    // Check for trailing period
    if (subject.endsWith('.')) {
      errors.push('Subject line should not end with a period');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
