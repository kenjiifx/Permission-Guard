# Contributing to Permission Guard

Thanks for your interest in contributing.

## Ground Rules

- Keep behavior deterministic and local-first.
- Do not add paid API dependencies or LLM-based scanning.
- Prefer explicit typing and modular code over clever shortcuts.
- Keep PRs small and reviewable.

## Development Setup

```bash
npm install
npm run build
npm run lint
npm run typecheck
npm run test
```

## Pull Request Guidelines

- Add or update tests for parser, rules, scorer, suggestions, and reporting when behavior changes.
- Include documentation updates when commands, flags, or output shapes change.
- Use conventional commit messages when possible (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Keep breaking changes out of V1 unless discussed in an issue first.

## Adding or Modifying Rules

When updating detection logic:

1. Add/update rule logic in `src/core/rules/registry.ts`.
2. Add corresponding tests in `tests/core/rules.test.ts`.
3. Confirm scoring impact in `tests/core/scorer.test.ts` when relevant.
4. Validate formatter output stability for JSON/Markdown reports.

## Security Bug Reports

Please do not open public issues for sensitive vulnerabilities.
Use the private process documented in `SECURITY.md`.
