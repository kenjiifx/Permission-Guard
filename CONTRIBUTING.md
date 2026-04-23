# Contributing to Permission Guard

Thanks for helping improve Permission Guard.

## Project Principles

Contributions should preserve these constraints:

- deterministic, local-first behavior
- no paid API dependencies
- no LLM-based analysis pipeline
- typed, testable, maintainable code
- practical security guidance over hype

## Local Setup

```bash
npm install
npm run ci
```

## Branch and PR Expectations

- Keep pull requests focused and reviewable
- Add/update tests whenever behavior changes
- Update docs when flags, outputs, or workflows change
- Prefer conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)

## Rule Engine Changes

If your PR adds or updates detection rules:

1. Update logic in `src/core/rules/registry.ts`
2. Add or update tests in `tests/core/rules.test.ts`
3. Validate risk score behavior in `tests/core/scorer.test.ts` if impacted
4. Ensure JSON and Markdown report output remains stable

## Suggested PR Checklist

- [ ] `npm run ci` passes locally
- [ ] tests added or updated for behavior changes
- [ ] docs updated where needed
- [ ] no dead code or placeholder logic

## Security Reporting

Please do not open public issues for exploitable vulnerabilities.
Use the private reporting process in `SECURITY.md`.
