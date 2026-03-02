---
title: "Kebab-case rename + @ alias for renderer src"
created: 2026-03-02T03:58:36.356Z
priority: P1-M
status: backlog
tags: [refactor]
---

# Kebab-case rename + @ alias for renderer src

1. Rename all PascalCase/camelCase files in src/ to kebab-case using git mv. 2. Add @ alias pointing to src/renderer/src in electron-vite config + tsconfig.web.json. 3. Update all imports across Main, Preload, Renderer and Shared to use kebab-case filenames and @ alias where applicable.

