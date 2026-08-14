# Repository Guidelines

## Project Structure & Module Organization

This is a Vue 3 + TypeScript uni-app application targeting H5 and mini-programs. Source code lives in `src/`:

- `pages/` contains route-level views; register new pages in `src/pages.json`.
- `components/` contains reusable UI, with feature groups such as `components/plan/`.
- `stores/` contains Pinia state; `api/`, `utils/`, and `types/` contain services, helpers, and shared models.
- `assets/` holds imported media, while `static/` holds fixed-path runtime assets such as tab bar icons.
- `styles/`, `uni.scss`, and `App.vue` provide shared SCSS and global styling.

Architecture and backend planning notes are in `doc/`. Generated files under `dist/` must not be edited or committed.

## Build, Test, and Development Commands

Use Node.js 20+ and pnpm 9+.

- `pnpm install --frozen-lockfile`: install the locked dependency set.
- `pnpm dev:h5`: run the H5 development server.
- `pnpm dev:mp-weixin`: watch-build into `dist/dev/mp-weixin` for WeChat DevTools.
- `pnpm build:h5` / `pnpm build:mp-weixin`: create production bundles.
- `pnpm test`: run all Vitest unit tests once.
- `pnpm type-check`: validate Vue and TypeScript types without emitting files.
- `pnpm exec eslint .`: lint TypeScript and Vue files.
- `pnpm exec prettier --check .`: verify formatting.

See `package.json` for matching commands for other supported platforms.

## Coding Style & Naming Conventions

Follow `.editorconfig`: UTF-8, LF endings, two-space indentation, and a final newline. Prettier enforces single quotes, no semicolons, trailing commas, and a 100-character width. Prefer `<script setup lang="ts">`, typed props/emits, and `@/` imports.

Use PascalCase for components (`PlanItemCard.vue`), camelCase for functions and variables, `useXStore` for Pinia stores, lowercase page paths, and BEM-like scoped classes such as `.plan-card__title`.

## Testing Guidelines

Vitest runs in the Node environment and discovers `src/**/*.spec.ts`. Keep tests beside the code they exercise, name them `<module>.spec.ts`, and cover both successful and failure paths. No coverage threshold is configured. Before opening a PR, run `pnpm test`, `pnpm type-check`, linting, and the relevant platform build; manually verify UI changes in H5 and WeChat DevTools.

## Commit & Pull Request Guidelines

History follows concise Conventional Commits, often with Chinese summaries: `feat(plan): ...`, `fix(deploy): ...`. Use `type(scope): description`, avoid duplicate prefixes, and keep each commit focused.

PRs should describe user-visible behavior, link related issues, list tested commands/platforms, and include screenshots or recordings for UI changes. Never commit real AppIDs, secrets, local `.env*` files, or generated `dist/` output; copy `.env.example` for local configuration.
