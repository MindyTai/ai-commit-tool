# ai-commit v1.0.0 — Release Notes

Date: 2025-08-28

This is the first public open source release of ai-commit, an AI-powered Git commit message generator with multi-provider support and a polished CLI workflow.

## Highlights
- Robust Conventional Commits support with concise subject lines and rich, natural commit bodies
- Multi-provider AI: OpenAI, OpenRouter, Ollama, and custom HTTP endpoints
- Interactive CLI with review/edit and optional non-interactive mode
- Secure, zero-config setup wizard that stores config in `~/.ai-commit.json`
- Open source under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)

## New features
- Configurable model/provider selection, including OpenRouter model choice
- Context-aware git diff parsing for better summaries
- Confirmation and edit step before committing; `--no-confirm` to skip

## Improvements
- Refined AI prompts to generate detailed, readable commit bodies
- Preserves natural paragraph formatting (no forced bullet lists)
- Simplified subject handling; long subjects flow into the body automatically
- Removed truncation; body carries the full detail

## Fixes
- Prevent duplicate Conventional Commit prefixes (e.g., avoids `feat: feat(...)`)
  - Implementation in `src/templates.ts` (subject cleaning and type detection)

## Docs & Licensing
- README overhauled with installation, usage, configuration, troubleshooting, and contribution guidance
- License switched to CC BY-NC 4.0 (non-commercial). See `LICENSE` and README license section
- Changelog removed from README; future release notes will be published via GitHub Releases

## Upgrade notes
- No breaking API changes expected for v1.0.0
- After upgrading:
  - Run `npx ai-commit --setup` (or just `ai-commit` once) to configure your preferred provider and model
  - Ensure your environment variables (e.g., OpenAI/OpenRouter keys) are set if using those providers

## Getting started
```bash
npm install -g ai-commit
ai-commit --setup
# or run inside a Git repo and follow prompts
ai-commit
```

## Acknowledgements
Thanks to early users and contributors for feedback on commit formatting, provider flexibility, and documentation quality.

— The ai-commit maintainers
