# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and API routes (e.g., `src/app/api/*`).
- `src/components`: UI and feature components; shared UI in `src/components/ui`.
- `src/calculations`: Core engineering/optimization logic with focused `__tests__` folders.
- `src/utils`, `src/hooks`, `src/types`: Helpers, React hooks, and shared TypeScript types.
- `public`: Static assets; `docs/` and `tasks/` hold design notes and PRDs.
- Tests live alongside code as `*.test.ts(x)` or under `__tests__/`.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server with HMR.
- `npm run build`: Production build (`.next/`).
- `npm start`: Run built app.
- `npm run lint`: ESLint checks (Next.js config).
- `npm test` / `npm run test:watch`: Jest unit tests (jsdom, ts-jest).

## Coding Style & Naming Conventions
- **Language**: TypeScript (strict). Use `@/` path alias (e.g., `import { x } from '@/utils/x'`).
- **Components**: PascalCase component names; filenames generally kebab-case (e.g., `design-comparison.tsx`).
- **Structure**: Keep domain logic in `src/calculations`, view logic in `src/components`, and types in `src/types`.
- **Linting**: Fix warnings before PRs (`npm run lint`). Match existing patterns; no Prettier config in repo.

## Testing Guidelines
- **Frameworks**: Jest + ts-jest, React Testing Library (`src/test-setup.ts` loads `@testing-library/jest-dom`).
- **Location/Names**: `*.test.ts` / `*.test.tsx` or `__tests__/name.test.ts` near the code under test.
- **Focus**: Cover calculation utilities and API routes; add RTL tests for interactive components.
- **Run**: `npm test` or `npm run test:watch`.

## Commit & Pull Request Guidelines
- **Branches**: Use prefixes like `feature/*`, `fix/*`, `enhancement/*`, `chore/*` (mirrors existing history).
- **Commits**: Imperative, concise summaries (e.g., “Fix angle orientation calculation”). Group related changes.
- **PRs**: Include description, linked issues, test notes, and UI screenshots when applicable. Ensure `lint` and `test` pass.

## Security & Configuration
- Store secrets in `.env.local` (not committed). Use `NEXT_PUBLIC_` only for values safe for the browser.
- Avoid introducing breaking API changes under `src/app/api/*` without updating affected clients and tests.
