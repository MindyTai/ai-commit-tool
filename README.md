# 🤖 AI Commit Tool

**Open source AI-powered git commit message generator** that creates meaningful, detailed commit messages using multiple AI providers. Streamline your development workflow with intelligent commit generation that follows best practices.

> 📄 **License**: Open source under CC BY-NC 4.0 - free for personal and educational use. Commercial use requires separate licensing.

## ✨ Key Features

- 🤖 **Multi-Provider AI**: OpenAI GPT-4, OpenRouter, Ollama, and custom API support
- 📝 **Smart Formatting**: Conventional Commits with detailed body descriptions
- 🔍 **Context Analysis**: Intelligent diff parsing and repository context awareness
- ✏️ **Interactive Workflow**: Review, edit, and validate before committing
- ⚙️ **Zero-Config Setup**: Guided setup wizard with persistent configuration
- 🛡️ **Security First**: Secure API key handling and input validation
- 🚀 **Production Ready**: Robust error handling and git integration

## 🚀 Quick Installation

```bash
# Install globally via npm
npm install -g ai-commit

# Or clone and build from source
git clone <repository-url>
cd ai-commit
npm install && npm run build
npm link
```

## 🎯 Quick Start Guide

### 1. **One-Time Setup**
```bash
ai-commit setup
```
Interactive wizard will configure:
- AI provider (OpenAI, OpenRouter, Ollama, Custom)
- API credentials
- Commit style preferences
- Model selection

### 2. **Daily Usage**
```bash
# Stage your changes
git add src/

# Generate intelligent commit message
ai-commit

# Review, edit if needed, and commit!
```

### 3. **Advanced Usage**
```bash
# Skip confirmation for trusted changes
ai-commit --no-confirm

# Use custom message with AI formatting
ai-commit -m "implement user authentication"
```

## Commands

### `ai-commit commit` or `ai-commit c`
Generate a commit message for staged changes and create the commit.

**Options:**
- `-m, --message <message>` - Use a custom message instead of AI generation
- `--no-confirm` - Skip confirmation prompt and commit immediately

**Examples:**
```bash
# Interactive commit with AI-generated message
ai-commit commit

# Use custom message
ai-commit commit -m "fix: resolve login issue"

# Auto-commit without confirmation
ai-commit commit --no-confirm
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
| `aiProvider` | `'openai' \| 'openrouter' \| 'ollama' \| 'custom'` | AI service provider | `'openai'` |
| `apiKey` | `string` | API key for the provider | - |
| `apiUrl` | `string` | API endpoint URL | - |
| `model` | `string` | Model name to use | `'gpt-3.5-turbo'` |
| `maxTokens` | `number` | Maximum tokens for generation | `150` |
| `includeContext` | `boolean` | Include repository context | `true` |
| `autoCommit` | `boolean` | Skip confirmation prompts | `false` |

## AI Providers

### 🔥 OpenAI (Recommended)
- **Models**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Quality**: Excellent commit message generation
- **Setup**: OpenAI API key required
- **Cost**: ~$0.01-0.03 per commit

### 🌐 OpenRouter
- **Models**: Claude, Llama, Mistral, and 50+ others
- **Quality**: High-quality alternatives to OpenAI
- **Setup**: OpenRouter API key
- **Cost**: Competitive pricing, often cheaper

### 🏠 Ollama (Local)
- **Models**: CodeLlama, Llama2, Mistral, etc.
- **Quality**: Good for privacy-focused workflows
- **Setup**: Local Ollama installation
- **Cost**: Free (runs on your hardware)

### 🔧 Custom API
- **Models**: Any OpenAI-compatible endpoint
- **Quality**: Depends on provider
- **Setup**: Custom API URL configuration
- **Cost**: Provider-dependent

## Commit Styles

### Conventional Commits
Follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

<body>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

**Example Output:**
```
feat(auth): add JWT token authentication

Implement comprehensive authentication system with secure token handling.
Added login endpoint with email/password validation and JWT middleware.
Includes bcrypt password hashing and token verification for protected routes.
Updated user model schema to support authentication fields and sessions.
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

## 🔧 Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Not a git repository` | Run from within a git repo: `git init` |
| `No staged changes found` | Stage files first: `git add .` |
| `API key is required` | Configure: `ai-commit setup` |
| `Failed to generate message` | Check internet, API key, and credits |
| `Model not found` | Verify model name in config |
| `Rate limit exceeded` | Wait or switch to different provider |

### Debug Commands
```bash
# Check current configuration
cat ~/.ai-commit.json

# Reconfigure from scratch
ai-commit setup

# Verify git status
git status

# Test with simple change
echo "test" > test.txt && git add test.txt && ai-commit
```

### 🆘 Getting Help
- Review configuration file
- Try different AI provider
- Check API key validity
- Ensure sufficient API credits

## 📄 License

**Creative Commons Attribution-NonCommercial 4.0 International**

This project is open source under the CC BY-NC 4.0 license.

### ✅ You Can:
- **Use** the software for personal and educational purposes
- **Share** and redistribute the code
- **Modify** and create derivative works
- **Contribute** improvements back to the project

### ❌ Restrictions:
- **No commercial use** without separate licensing
- **Attribution required** - credit the original author
- **Same license** for derivative works

See the [LICENSE](LICENSE) file for full legal terms.

### 💼 Commercial Licensing
For commercial use, enterprise features, or custom licensing, please contact the copyright holder.

## 🤝 Contributing

Contributions are welcome! This is open source software under CC BY-NC 4.0.

### Development Setup
```bash
git clone <repository-url>
cd ai-commit
npm install
npm run dev  # Watch mode
```

### Contribution Guidelines
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** using this tool (`ai-commit`)
4. **Test** your changes thoroughly
5. **Submit** pull request with detailed description

### Code Standards
- TypeScript with strict typing
- Conventional Commits format
- Comprehensive error handling
- Security-first approach

All contributions will be under the same CC BY-NC 4.0 license.

## 📋 Releases

See [GitHub Releases](../../releases) for version history, changelogs, and download links.

---

**Made with ❤️ for developers who care about commit quality**

> 💡 **Pro Tip**: Use `ai-commit --no-confirm` in CI/CD pipelines for automated, high-quality commits!
