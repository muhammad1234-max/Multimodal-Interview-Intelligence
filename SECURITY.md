# Security Policy

## Supported Versions

Currently, only the latest release of the Multimodal AI Interview Evaluator is actively supported for security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover any security-related issues, please DO NOT create a public GitHub issue.

Instead, please responsibly disclose it by emailing the maintainer. We take security seriously and will respond to reports within 48 hours.

### Scope

The following areas are considered in-scope for security reports:
- Authentication bypass (JWT manipulation)
- Prompt Injection in the LLM / RAG pipeline
- Unauthorized access to historical video uploads or MongoDB sessions
- Remote Code Execution (RCE) via the video processing pipeline (FFmpeg / PyTorch)
- Cross-Site Scripting (XSS) on the frontend Dashboard

Please provide detailed steps to reproduce the vulnerability. If applicable, we will issue a CVE and credit you in the project release notes.
