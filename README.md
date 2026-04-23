# Permission Guard

PermissionGuard is a local-first CLI for identifying overly broad AWS IAM permissions, explaining why they are risky, and producing safer reviewable remediation candidates.

It is deterministic, rule-based, and designed for security reviews and CI workflows. It does **not** call LLM APIs and does **not** claim perfect least privilege.

## Why this exists

IAM policy sprawl is common: `Action: "*"`, service wildcards, and unscoped resources often survive into production. PermissionGuard helps teams quickly spot these patterns and produce safer candidate changes that can be reviewed and iterated.

## Install

```bash
npm install -g permissionguard
```

For local development:

```bash
npm install
npm run build
```

## Quickstart

```bash
permissionguard scan examples/admin-policy.json
permissionguard suggest examples/broad-s3-policy.json --candidate-output safer-policy.json
permissionguard report examples/mixed-policy.json --format markdown --output report.md
permissionguard fetch --role MyAppRole
permissionguard scan --role MyAppRole --strict
```

## Usage

### `permissionguard scan <input>`

Scan a local IAM policy file.

Options:
- `--role <roleName>`: Scan policies attached to a role instead of file input
- `--strict`: Exit non-zero for medium/high/critical findings
- `--quiet`: Suppress console output
- `--json`: Emit machine-readable JSON
- `--output <path>`: Write output to a file
- `--no-color`: Disable terminal colors

### `permissionguard suggest <input>`

Run scan + suggestions + candidate safer policy generation.

Options:
- `--candidate-output <path>`: Write candidate policy JSON to a dedicated file
- `--output <path>`: Write scan/suggestion report output (terminal or JSON mode)

### `permissionguard report <input> --format terminal|json|markdown`

Render findings in terminal, JSON, or Markdown.

### `permissionguard fetch --role <roleName>`

Fetch inline and attached managed role policies via AWS SDK v3 and print a combined payload.

### `permissionguard version` / `permissionguard help`

Built-in Commander commands.

## Supported checks (V1)

- Wildcard action (`Action: "*"`) - critical
- Wildcard resource (`Resource: "*"`) - high/critical by context
- Broad service wildcard (`s3:*`, `ec2:*`, `iam:*`, etc.)
- Sensitive IAM and privilege escalation actions
- Admin policy behavior (`Allow` + `*` + `*`)
- Excessive broad write permissions
- Missing resource scoping opportunity
- Missing conditions on risky broad patterns

## Output and scoring

- Deterministic risk score `0-100`
- Severity-aware weighting and compounding
- Suggestions with confidence:
  - `safe`
  - `review-needed`
  - `manual-only`
- Candidate policy output is generated only when confidence is adequate

## Exit codes

- `0`: Success, no strict-mode blocker
- `1`: Runtime/input/config error
- `2`: Strict mode blocker (medium/high)
- `3`: Strict mode blocker includes critical

## Safety philosophy

PermissionGuard is conservative and review-oriented:
- It flags broad IAM risk patterns quickly.
- It provides safer candidate changes where confidence is reasonable.
- It avoids claiming full least-privilege automation.
- It keeps all analysis local to your machine.

## Limitations

- V1 scope is IAM JSON policies and role-based fetching only.
- Suggestions are candidate guidance, not guaranteed deploy-ready output.
- Some AWS actions require context-specific tuning.

## Roadmap

- Add users/groups fetch support
- Expand action/resource capability metadata
- Improve report diffing and baseline workflows
- Optional policy pack customization

## Development

Scripts:
- `npm run build`
- `npm run dev`
- `npm run lint`
- `npm run ci`
- `npm run typecheck`
- `npm run test`
- `npm run test:watch`
- `npm run format`

## Contributing

PRs are welcome. Please include tests for new rules, scoring changes, or output format changes. Keep behavior deterministic and avoid introducing network dependencies outside AWS SDK calls initiated by user commands.

## Community and Governance

- Contribution guide: `CONTRIBUTING.md`
- Code of conduct: `CODE_OF_CONDUCT.md`
- Security policy: `SECURITY.md`
