# CHARI — Claude Code Guidelines

## Agent 分工規則

spawn subagent 時，依任務性質選擇 model：

| 任務類型 | model | 參考 |
|---------|-------|------|
| 架構規劃、Code Review、最終審查 | opus | .claude/agents/project-manager.md, .claude/agents/code-reviewer.md |
| 寫程式、文件分析 | sonnet | .claude/agents/developer.md, .claude/agents/document-analyst.md |
| 瀏覽器操作、檔案整理、簡單掃描 | haiku | .claude/agents/browser-tester.md, .claude/agents/file-organizer.md |

原則：**Haiku 跑腿、Sonnet 做事、Opus 把關。** 有疑慮時往上升一級。

spawn 時將對應 agents/*.md 的內容帶入 prompt，確保 subagent 知道自己的角色與輸出格式。

## Project Overview

CHARI 是一個 SMART on FHIR 醫療資料交換平台，包含醫師端 (Physician Client) 與管理端 (Admin Dashboard)。技術棧：React 19 + TypeScript + Vite + Tailwind CSS + fhirclient。

## Project Structure

- `plan/` — 專案規格書 (`CHARI-PROJECT-SPEC.md`)、SMART on FHIR 開發指南、測試資料
- `src/` — 應用程式原始碼，UI 按 feature 組織 (e.g. `src/modules/exchange/*`)
- `src/services/fhir/` — FHIR query helpers
- `test-data/` — 測試用 FHIR payloads
- `.claude/agents/` — AI agent 角色定義

## Build & Dev Commands

```bash
npm install          # 安裝依賴
npm run dev          # Vite dev server
npm run build        # Production build (GitHub Pages)
npm run lint         # ESLint
npm run deploy       # Deploy to GitHub Pages
```

## Coding Style

- Prettier + ESLint, 2-space indent
- Components: `PascalCase.tsx`, hooks/utilities: `camelCase`
- JSON pretty-printed for readable diffs
- FHIR helpers 放 `src/services/fhir/`
- Composition-to-LOINC constants 需參照 `plan/CHARI-PROJECT-SPEC.md`

## Commit Convention

Conventional Commits: `feat(client): support audit export`
- Subject ≤72 chars
- PR 需說明 user impact、引用 spec section、附 screenshot (如涉及 UI)

## Security

- 不 commit credentials，secrets 放 `.env.local`
- HTTPS only for FHIR endpoints
- 最小化 SMART scopes
