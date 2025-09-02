import { BaseValidator } from './BaseValidator';
import { ValidationResult } from '../constants';

/**
 * Validates freeform commit messages with minimal constraints
 */
export class FreeformValidator extends BaseValidator {
  validate(message: string): ValidationResult {
    const subject = this.getSubjectLine(message);
    const errors = this.validateBasicStructure(subject);

    // Freeform allows natural language, so minimal validation
    // No restrictions on capitalization, periods, or format

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
