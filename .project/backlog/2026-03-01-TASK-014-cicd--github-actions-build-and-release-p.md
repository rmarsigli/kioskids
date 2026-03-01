---
title: "CI/CD — GitHub Actions Build and Release Pipeline"
created: 2026-03-01T21:23:35.113Z
priority: P2-M
status: backlog
tags: [chore]
---

# CI/CD — GitHub Actions Build and Release Pipeline

Two GitHub Actions workflows. ci.yml: triggers on push to main/develop and PRs — runs on windows-latest: pnpm install --frozen-lockfile, lint, test, build. release.yml: triggers on v*.*.* tags — same steps + electron-builder --win --publish always with GH_TOKEN secret. Published artifacts: KiosKids-Setup-X.X.X.exe + latest.yml (electron-updater manifest). pnpm release script for version bump + tag + push. Document release flow in root README.md. Depends on T013 (electron-builder publish config must exist).

