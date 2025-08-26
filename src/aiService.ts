import OpenAI from 'openai';
import { Config } from './config';
import { getStagedFiles, getRepoInfo } from './gitUtils';

export async function generateCommitMessage(stagedChanges: string, config: Config): Promise<string> {
  switch (config.aiProvider) {
    case 'openai':
      return generateWithOpenAI(stagedChanges, config);
    case 'ollama':
      return generateWithOllama(stagedChanges, config);
    case 'openrouter':
      return generateWithOpenRouter(stagedChanges, config);
    case 'custom':
      return generateWithCustomAPI(stagedChanges, config);
    default:
      throw new Error(`Unsupported AI provider: ${config.aiProvider}`);
  }
}

async function generateWithOpenAI(stagedChanges: string, config: Config): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({
    apiKey: config.apiKey,
  });

  const prompt = await buildPrompt(stagedChanges, config);

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(config.commitStyle)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: 0.3,
    });

    const message = response.choices[0]?.message?.content;
    if (!message) {
      throw new Error('No response from OpenAI');
    }

    return message.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw new Error('OpenAI API error: Unknown error');
  }
}

async function generateWithOpenRouter(stagedChanges: string, config: Config): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const prompt = await buildPrompt(stagedChanges, config);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/ai-commit-tools',
        'X-Title': 'AI Commit Tools'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(config.commitStyle)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to read error response');
      throw new Error(`OpenRouter API error: HTTP ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Debug log the response structure
    console.log('OpenRouter response:', JSON.stringify(data, null, 2));
    
    const message = data.choices?.[0]?.message?.content;
    if (!message) {
      console.error('OpenRouter response structure:', data);
      throw new Error(`No response from OpenRouter. Response: ${JSON.stringify(data)}`);
    }

    return message.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenRouter API error: ${error.message}`);
    }
    throw new Error('OpenRouter API error: Unknown error');
  }
}

async function generateWithOllama(stagedChanges: string, config: Config): Promise<string> {
  if (!config.apiUrl) {
    throw new Error('Ollama API URL is required');
  }

  // Test connection first
  try {
    const healthCheck = await fetch(`${config.apiUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(1500000)
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

  const prompt = await buildPrompt(stagedChanges, config);
  const systemPrompt = getSystemPrompt(config.commitStyle);
  
  // Debug log the request
  console.log('Sending request to Ollama with model:', config.model);
  console.log('System prompt length:', systemPrompt.length);
  console.log('User prompt length:', prompt.length);
  
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
        temperature: 0.1, // Lower temperature for more consistent commit messages
      }
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${config.apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(1200000)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to read error response');
      console.error('Ollama API error response:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
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
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Ollama request timed out. The model might be loading or the request is too complex.');
      }
      throw new Error(`Ollama API error: ${error.message}`);
    }
    throw new Error('Ollama API error: Unknown error');
  }
}

async function generateWithCustomAPI(stagedChanges: string, config: Config): Promise<string> {
  if (!config.apiUrl) {
    throw new Error('Custom API URL is required');
  }

  const prompt = await buildPrompt(stagedChanges, config);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(config.commitStyle)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const fullMessage = data.choices?.[0]?.message?.content || data.response;
    
    if (!fullMessage) {
      throw new Error('No response from custom API');
    }

    // Only return the first line of the commit message
    const firstLine = fullMessage.split('\n')[0].trim();
    return firstLine;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Custom API error: ${error.message}`);
    }
    throw new Error('Custom API error: Unknown error');
  }
}

function getSystemPrompt(commitStyle: 'conventional' | 'freeform'): string {
  return `You are a helpful assistant that writes git commit messages.
- Always write in imperative tense.
- Be concise (max 1 line).
- Use conventional commit style (feat, fix, chore, docs, refactor, test, etc.).`;
}

async function buildPrompt(stagedChanges: string, config: Config): Promise<string> {
  const fewShotExamples = `Example:
diff --git a/user.py b/user.py
index 1234567..abcdefg 100644
--- a/user.py
+++ b/user.py
@@ -10,6 +10,9 @@ class User:
     def __init__(self, name):
         self.name = name
 
+    def get_username(self):
+        return self.name
+
Output: feat(user): add get_username method

Example:
diff --git a/auth.py b/auth.py
index 2345678..bcdefgh 100644
--- a/auth.py
+++ b/auth.py
@@ -15,7 +15,10 @@ def authenticate(token):
     if not token:
-        return False
+        raise ValueError("Token is required")
     
     return verify_token(token)

Output: fix(auth): handle missing token

Now your turn:`;

  return `${fewShotExamples}\n${stagedChanges}`;
}
