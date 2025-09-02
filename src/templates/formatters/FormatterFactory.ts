import { Config } from '../../config';
import { BaseFormatter } from './BaseFormatter';
import { ConventionalFormatter } from './ConventionalFormatter';
import { FreeformFormatter } from './FreeformFormatter';

/**
 * Factory for creating appropriate formatters based on commit style
 */
export class FormatterFactory {
  static create(config: Config): BaseFormatter {
    switch (config.commitStyle) {
      case 'conventional':
        return new ConventionalFormatter(config);
      case 'freeform':
        return new FreeformFormatter(config);
      default:
        throw new Error(`Unsupported commit style: ${config.commitStyle}`);
    }
  }
}
