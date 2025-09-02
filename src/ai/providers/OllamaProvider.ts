import { Config } from '../../config';
import { BaseProvider } from './BaseProvider';

export class OllamaProvider extends BaseProvider {
  async generateCommitMessage(stagedChanges: string, config: Config): Promise<string> {
    if (!config.apiUrl) {
      throw new Error('Ollama API URL is required');
    }

    // Test connection first
    await this.testConnection(config.apiUrl);

    const prompt = await this.buildPrompt(stagedChanges, config);
    const systemPrompt = this.getSystemPrompt(config);
    
    try {
      const requestBody = {
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: {
          num_predict: config.maxTokens,
          temperature: 0.1,
        }
      };
      
      const response = await fetch(`${config.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(120000) // 2 minutes
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        
        if (response.status === 404) {
          throw new Error(`Model not found. Available models: run 'ollama list' to see installed models`);
        }
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const responseText = await response.text();
      let fullMessage = '';
      
      try {
        // Try to parse as JSON (non-streaming response)
        const data = JSON.parse(responseText);
        fullMessage = data.message?.content || '';
      } catch (e) {
        // Handle streaming response (one JSON object per line)
        const lines = responseText.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullMessage += data.message.content;
            }
          } catch (e) {
            console.warn('Failed to parse Ollama response line:', line);
          }
        }
      }
      
      fullMessage = fullMessage.trim();
      if (!fullMessage) {
        throw new Error('Empty response from Ollama');
      }

      // Return only the first line of the commit message
      return fullMessage.split('\n')[0].trim();
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('Ollama request timed out. The model might be loading or the request is too complex.');
      }
      throw this.createError('generate commit message', error);
    }
  }

  private async testConnection(apiUrl: string): Promise<void> {
    try {
      const healthCheck = await fetch(`${apiUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(15000)
      });
      
      if (!healthCheck.ok) {
        throw new Error(`Ollama server not responding (HTTP ${healthCheck.status})`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new Error('Ollama server is not running or not reachable. Please start Ollama with: ollama serve');
        }
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          throw new Error('Cannot connect to Ollama. Please ensure Ollama is running on http://localhost:11434');
        }
        throw new Error(`Ollama connection failed: ${error.message}`);
      }
      throw new Error('Failed to connect to Ollama server');
    }
  }

  protected getProviderName(): string {
    return 'Ollama';
  }
}
