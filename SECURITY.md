# Security Policy

## Supported Versions

Permission Guard is currently in early V1 development. Security fixes are applied to the `main` branch first.

## Reporting a Vulnerability

If you discover a security issue, please report it privately through GitHub Security Advisories:

- <https://github.com/kenjiifx/Permission-Guard/security/advisories/new>

If you cannot use GitHub advisories, open a private maintainer contact request in issues:

- <https://github.com/kenjiifx/Permission-Guard/issues/new/choose>

Please include:

- A clear description of the issue
- Reproduction steps or proof of concept
- Impact assessment
- Suggested remediation if known

Do not publicly disclose sensitive vulnerabilities before maintainers have had a chance to investigate and patch.

## Response Expectations

- Initial acknowledgment target: within 5 business days
- Status updates target: at least once every 7 business days while actively investigating
- Public disclosure: coordinated after a patch is available

## Scope Notes

This project is a local-first CLI and does not run a hosted service.
Most issues will involve:

- Input parsing and validation boundaries
- Dependency risk
- CLI behavior that could lead to unsafe defaults
