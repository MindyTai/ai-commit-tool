# AI Commit

An intelligent CLI tool that generates meaningful git commit messages using AI. Supports multiple AI providers including OpenAI, Ollama, and custom APIs.

## Features

- 🤖 **AI-Powered**: Generate detailed commit messages using OpenAI, Ollama, or custom AI providers
- 📝 **Multiple Styles**: Support for Conventional Commits and freeform styles
- ⚙️ **Configurable**: Easy setup wizard with persistent configuration
- 🔍 **Context-Aware**: Analyzes staged changes and repository context
- ✏️ **Interactive**: Review and edit messages before committing
- 🚀 **Fast**: Quick generation with smart caching

## Installation

```bash
npm install -g ai-commit
```

## Quick Start

1. **Initial Setup**
   ```bash
   ai-commit setup
   ```
   This will guide you through configuring your AI provider and preferences.

2. **Generate Commit Message**
   ```bash
   # Stage your changes
   git add .
   
   # Generate and commit
   ai-commit
   ```

## Commands

### `ai-commit` or `ai-commit commit`
Generate a commit message for staged changes and create the commit.

**Options:**
- `-m, --message <message>` - Use a custom message instead of AI generation
- `--no-confirm` - Skip confirmation prompt and commit immediately

**Examples:**
```bash
# Interactive commit with AI-generated message
ai-commit

# Use custom message
ai-commit -m "fix: resolve login issue"

# Auto-commit without confirmation
ai-commit --no-confirm
```

### `ai-commit setup`
Run the configuration wizard to set up your AI provider and preferences.

## Configuration

Configuration is stored in `~/.ai-commit.json`. You can edit this file directly or use the setup command.

### Example Configuration

```json
{
  "commitStyle": "conventional",
  "aiProvider": "openai",
  "apiKey": "sk-...",
  "model": "gpt-3.5-turbo",
  "maxTokens": 150,
  "includeContext": true,
  "autoCommit": false
}
```

### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `commitStyle` | `'conventional' \| 'freeform'` | Commit message style | `'conventional'` |
| `aiProvider` | `'openai' \| 'ollama' \| 'custom'` | AI service provider | `'openai'` |
| `apiKey` | `string` | API key for the provider | - |
| `apiUrl` | `string` | API endpoint URL | - |
| `model` | `string` | Model name to use | `'gpt-3.5-turbo'` |
| `maxTokens` | `number` | Maximum tokens for generation | `150` |
| `includeContext` | `boolean` | Include repository context | `true` |
| `autoCommit` | `boolean` | Skip confirmation prompts | `false` |

## AI Providers

### OpenAI
- **Models**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo-preview`
- **Setup**: Requires OpenAI API key
- **Cost**: Pay-per-use based on OpenAI pricing

### Ollama (Local)
- **Models**: Any model supported by Ollama (llama2, codellama, etc.)
- **Setup**: Requires local Ollama installation
- **Cost**: Free (runs locally)

### Custom API
- **Models**: Any OpenAI-compatible API
- **Setup**: Requires API endpoint URL
- **Cost**: Depends on provider

## Commit Styles

### Conventional Commits
Follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

<body>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

**Example:**
```
feat(auth): add JWT token authentication

- Implement login endpoint with email/password validation
- Add JWT token generation and verification middleware
- Update user model to include authentication fields
- Add password hashing with bcrypt
```

### Freeform
Natural language commit messages focused on clarity:

**Example:**
```
Add user authentication system

Implement a complete authentication system with JWT tokens.
Users can now register, login, and access protected routes.
Includes password hashing and token validation middleware.
```

## Examples

### Basic Usage
```bash
# Stage your changes
git add src/auth.js src/middleware/jwt.js

# Generate commit message
ai-commit
```

### With Custom Message
```bash
ai-commit -m "fix: resolve memory leak in user session handling"
```

### Auto-commit Mode
```bash
# Skip confirmation (use with caution)
ai-commit --no-confirm
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/ai-commit.git
cd ai-commit

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm test` - Run tests (when available)

## Publishing

To publish this package to npm:

1. **Update Version**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

3. **Publish**
   ```bash
   npm publish
   ```

## Troubleshooting

### Common Issues

**"Not a git repository"**
- Ensure you're running the command from within a git repository
- Initialize git if needed: `git init`

**"No staged changes found"**
- Stage your changes first: `git add .` or `git add <files>`

**"API key is required"**
- Run `ai-commit setup` to configure your API key
- Ensure your API key is valid and has sufficient credits

**"Failed to generate commit message"**
- Check your internet connection
- Verify your AI provider configuration
- Try a different model or provider

### Getting Help

- Check the configuration: `cat ~/.ai-commit.json`
- Run setup again: `ai-commit setup`
- Check staged changes: `git status`

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- Support for OpenAI, Ollama, and custom APIs
- Conventional Commits and freeform styles
- Interactive setup wizard
- Configurable commit generation
