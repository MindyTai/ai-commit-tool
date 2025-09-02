/**
 * Handles sanitization and cleaning of raw commit messages
 */
export class MessageSanitizer {
  /**
   * Sanitizes raw input by removing markdown and normalizing whitespace
   */
  sanitize(message: string): string {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid input: message must be a non-empty string');
    }

    let sanitized = message.trim();
    
    // Remove markdown formatting that might have been added by AI
    sanitized = this.removeMarkdownFormatting(sanitized);
    
    return sanitized;
  }

  /**
   * Parses message into non-empty lines
   */
  parseLines(message: string): string[] {
    return message
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private removeMarkdownFormatting(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1')     // Remove inline code
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1');    // Remove italic
  }
}
