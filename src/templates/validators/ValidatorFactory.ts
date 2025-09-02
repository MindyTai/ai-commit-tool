import { Config } from '../../config';
import { BaseValidator } from './BaseValidator';
import { ConventionalValidator } from './ConventionalValidator';
import { FreeformValidator } from './FreeformValidator';

/**
 * Factory for creating appropriate validators based on commit style
 */
export class ValidatorFactory {
  static create(config: Config): BaseValidator {
    switch (config.commitStyle) {
      case 'conventional':
        return new ConventionalValidator(config);
      case 'freeform':
        return new FreeformValidator(config);
      default:
        throw new Error(`Unsupported commit style: ${config.commitStyle}`);
    }
  }
}
