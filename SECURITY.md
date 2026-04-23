# Security Policy

## Supported Versions

Permission Guard is currently in active V1 development.
Security fixes are applied to `main` first, then included in the next release cut.

## Reporting a Vulnerability

If you discover a potential vulnerability, report it privately through GitHub Security Advisories:

- <https://github.com/kenjiifx/Permission-Guard/security/advisories/new>

If you cannot use advisories, open a maintainer contact request:

- <https://github.com/kenjiifx/Permission-Guard/issues/new/choose>
- Email: alammoosa07@gmail.com

Please include, where possible:

- A clear description of the issue
- Reproduction steps or proof of concept
- Impact assessment
- Suggested remediation if known

Do not publicly disclose security vulnerabilities before maintainers have had time to investigate and publish a fix or mitigation.

## Response Expectations

- Initial acknowledgment target: within 5 business days
- Status update target: at least once every 7 business days while investigating
- Public disclosure: coordinated after a fix is available

## Scope Notes

This project is a local-first CLI and does not run a hosted service.
Most security reports are likely to involve:

- Input parsing and validation boundaries
- Dependency risk
- CLI behavior that could lead to unsafe defaults
