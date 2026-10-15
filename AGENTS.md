# T-Car: agent notes

The front end is being migrated to the architecture in `docs/` (start at
`docs/README.md`). Work happens on branch `refactor/architecture-layers`.

**Migration status** lives in `docs/README.md` → "Migration status" (phase and
feature tables, and where the code differs from the docs). Read it before
choosing work; update it in the same commit as the work. The as-built
conventions are in `docs/01-architecture-layers.md` §1.5.

## Workflow: one fraction per commit

1. Pick the next item from the status tables; confirm the phase with the
   user. Open: phase 2 (routing), 5 (performance), 6 (i18n), 7 (images,
   doc 7 §7.4), 8 (styles from SCSS, doc 8 §8.3); doc 4 dialog migration continues with phase 4.
   New UI uses the `shared/ui` components (tested with `npm run test`).
2. Split it into fractions, each its own commit, in this order:
   move into `features/<x>/` with no behavior change → data behind
   `services/<x>.api.ts` + `features/<x>/queries.ts` → writes that return a
   `Result` / `ActionResult`.
3. Verify every fraction: `npx tsc --noEmit -p .`, `npx next lint`,
   `npx next build`, then `npx next start -p 3123` and `curl` the affected
   pages (HTML contains the expected markup; unknown ids carry
   `NEXT_NOT_FOUND`). Stop the server afterwards.
4. Run `git checkout tsconfig.tsbuildinfo` (tracked build cache), report the
   verified fraction, and **wait for the user's approval before committing**.
   No commit without explicit approval, every time; approval for one commit
   does not cover the next. Commit on the branch, keep commits local; the user
   pushes.
5. Done when the fraction is committed, verified, and the status tables in
   `docs/README.md` reflect it.

Ask the user before: any `git commit`; deleting `BookingModal`, `BookingMonthlyModal`,
`InsufficientBalanceModal` (waiting on product); choosing a backend contract
(no real endpoints exist); anything that contradicts a doc.

## Conventions

- **Feature API**: `features/<x>/index.ts` exports components, types, and pure
  rules only; it must stay safe for client components to import. Pages import
  server reads from `@/features/<x>/queries` (`import 'server-only'`).
- **Model**: `model.ts` holds types and pure rules (no React, no I/O).
  `services/` may import `features/*/model` and `shared/{lib,config}`.
- **Data access**: `services/<x>.api.ts` exports an interface plus, for now,
  the mock from `services/mocks/<x>.ts`. A mock that runs on the server stays
  read-only or stateless (module state would be shared between users); each
  mock includes one reproducible failure rule, documented in the file.
- **Errors**: reads throw `AppError` (`shared/lib/errors.ts`); queries return
  `null` for `not_found` so the page calls `notFound()`. Writes return
  `Result`. Server Actions return `ActionResult` via `toActionResult`, and the
  client calls `fromActionResult` (an `AppError` instance cannot cross the
  boundary). User-facing error text comes from `errors.*` in both
  `messages/ar.json` and `messages/en.json`, shown with `useErrorMessage()`.
  A failed submit keeps the dialog open with the input and the error.
- **Auth**: NextAuth v5 in `src/auth.ts`; the backend token is read only by
  `services/http/server.ts`. `AUTH_SECRET` is in `.env.local`.
  Mock sign-in: code `1234`, `+966500000000` has an account.
- **Navigation**: `Link` and `useRouter` come from `@/i18n/navigation`, with
  locale-less paths.
- **Props**: `interface Props` sits in the component file.
- **`shared/ui`**: one folder per component: `<Name>.tsx`, `<Name>.scss` (if
  styled), `<Name>.test.tsx`, `index.ts` exporting the component and
  `<Name>Props`. Named exports; no root `shared/ui/index.ts`. See doc 4 §4.4.
- **Formatting**: keep the existing formatting; do not reformat whole files or
  the repo. Prettier (`.prettierrc`) is only for files that are genuinely
  unformatted (a component on one line, packed JSX) and for new files:
  `npm run format -- <files>`.
- **Styles**: no new rules in `main.scss`; feature styles go in
  `features/<x>/<x>.scss`, component styles next to the component (doc 8
  step 6 plan).
- **API integration is a later, separate phase**: every `services/*.api.ts`
  stays on its mock; note integration needs as follow-ups instead of wiring
  endpoints.

## Gotchas

- Source files mix CRLF and LF line endings; normalise before exact-string
  replacements.
- App Router folders starting with `_` are private (not routes); name
  throwaway probe routes normally and delete them after use.
- `notFound()` under the root streaming `loading.tsx` returns HTTP 200; the
  404 page renders in the browser. Known, documented in doc 3.
- Vitest sometimes fails every file at once in `vitest.setup.ts` with "failed to
  find the current suite" ("no tests"), with jsdom setup taking most of the run.
  Seen right after a build or a server stop; the cause is not established. It is
  not a test failure: run `npm run test` again with nothing else running (tests
  first, then build and start the server).
