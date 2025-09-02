import { BaseFormatter } from './BaseFormatter';

/**
 * Formats messages in natural language without conventional constraints
 */
export class FreeformFormatter extends BaseFormatter {
  formatSubject(subject: string): string {
    subject = this.removeTrailingPeriod(subject);
    return this.capitalizeFirst(subject);
  }

  createSummarySubject(longMessage: string): string {
    const words = longMessage.toLowerCase().split(/\s+/);
    const actionWords = ['add', 'remove', 'update', 'fix', 'improve', 'refactor', 'implement', 'create', 'delete', 'enhance'];
    
    // Find the main action
    const action = words.find(word => actionWords.includes(word)) || 'Update';
    
    // Create a natural summary
    let summary = longMessage.trim();
    if (summary.length > 50) {
      // Extract key parts for a shorter summary
      const keyWords = words.filter(word => 
        word.length > 3 && 
        !['from', 'with', 'that', 'this', 'when', 'where', 'they', 'have', 'been', 'will', 'were', 'are'].includes(word)
      ).slice(0, 6);
      summary = keyWords.join(' ');
    }
    
    return this.capitalizeFirst(summary);
  }

  protected processBodyLines(lines: string[]): string[] {
    // For freeform, preserve natural formatting with minimal processing
    return lines.map(line => {
      // Convert various bullet formats to standard dash format
      line = line.replace(/^[•*+]\s*/, '- ');
      line = line.replace(/^\d+\.\s*/, '- ');
      
      return line;
    });
  }
}
