# Repository Guidelines

## Project Structure & Module Organization

This is a Vue 3 + TypeScript UniApp application targeting H5 and multiple mini-program platforms. Application code lives in `src/`:

- `pages/` contains route-level screens; register new pages in `src/pages.json`.
- `components/` contains reusable Vue components, with feature-specific components grouped in subdirectories such as `components/plan/`.
- `stores/` contains Pinia stores; `api/`, `utils/`, and `types/` hold service, helper, and type modules.
- `assets/` contains imported images; `static/` contains files referenced by fixed runtime paths, including tab bar icons.
- `styles/`, `uni.scss`, and `App.vue` define shared SCSS and global application styling.

Generated output is written to `dist/` and must not be edited directly. No automated test directory currently exists.

## Build, Test, and Development Commands

Use Node.js 20+ and pnpm 9+.

- `pnpm install`: install locked dependencies.
- `pnpm dev:h5`: start the H5 development server.
- `pnpm dev:mp-weixin`: watch and compile to `dist/dev/mp-weixin` for WeChat DevTools.
- `pnpm build:h5`: create the production H5 bundle.
- `pnpm build:mp-weixin`: create the production WeChat mini-program bundle.
- `pnpm type-check`: run `vue-tsc` without emitting files.
- `pnpm exec eslint .`: lint Vue and TypeScript sources.
- `pnpm exec prettier --check .`: verify formatting.

Other supported platforms have matching `dev:<platform>` and `build:<platform>` scripts in `package.json`.

## Coding Style & Naming Conventions

Use two-space indentation, LF line endings, UTF-8, and a final newline. Prettier uses single quotes, no semicolons, trailing commas, and a 100-character print width. Prefer `<script setup lang="ts">`, typed props/emits, and the `@/` alias for `src/` imports.

Name Vue components in PascalCase (`WeekendInviteModal.vue`), functions and variables in camelCase, and Pinia composables as `useXStore`. Keep page paths lowercase. Use BEM-like scoped class names such as `.invite-card__title`.

## Testing Guidelines

There is no configured unit-test framework or coverage threshold. Before submitting changes, run type checking, linting, and both H5 and relevant mini-program builds. Manually verify responsive layout and platform APIs in H5 and WeChat DevTools. If tests are introduced, place `*.spec.ts` beside the module or under `src/**/__tests__/`.

## Commit & Pull Request Guidelines

The repository has no established commit history to infer conventions from. Use concise imperative messages, preferably Conventional Commit style, for example `fix(home): cover tab bar with invite modal`.

Pull requests should explain the user-facing change, list tested platforms and commands, link related issues, and include screenshots or recordings for UI work. Keep generated `dist/` files, local `.env*` files, real AppIDs, and secrets out of commits.
