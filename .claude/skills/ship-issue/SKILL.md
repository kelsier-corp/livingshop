---
name: ship-issue
description: Implement one or more GitHub issues in this repo end-to-end — branch, code, migrate, run locally, verify in the browser, and open/update the PR with real test results. Use when asked to "resolve issue #N", "implement #N and #M", or "ship issue #N".
---

Follow these steps in order. Don't skip the branch step to start coding faster — re-doing work on the wrong branch costs more than the two minutes it takes to cut one first.

## 1. Read the issue(s)

`gh issue view <N> --repo kelsier-corp/livingshop --json title,body,assignees,labels`

If multiple issues are tightly coupled (one explicitly extends or depends on another's output — check for that in the body), it's fine to do them on one branch with one PR referencing both. Otherwise, one branch per issue.

## 2. Branch first, before any edit or plan

```bash
git checkout develop && git pull
git checkout -b feature/<issue-number>-<descriptive-slug>
```

Never plan or write code while sitting on `develop`/`main` — see `CLAUDE.md`'s Branching section.

## 3. Implement

Mirror the existing layering (`CLAUDE.md`'s Architecture section): domain entity/interface → application service → Prisma repository → controller/validator/route → wire in `app.ts`, then the `apps/web` side. If the schema changes, add a hand-written or `prisma migrate dev`-generated migration under `apps/api/prisma/migrations/`.

## 4. Run it locally — prefer local Postgres over Docker

Check whether a local Postgres is already reachable before starting Docker Desktop (see `CLAUDE.md`'s "Commands" section — the port isn't always 5432). Only fall back to `docker compose up --build` if nothing local is reachable.

```bash
cd apps/api
npm run prisma:migrate   # applies the schema, creates a migration if this change needs one
npm run seed              # only if the local DB isn't already seeded
npm run dev                # :4000

cd ../web
npm run dev                # :5173
```

Remember: `seed` doesn't auto-load `.env` (see `CLAUDE.md`) — pass `DATABASE_URL` inline if you hit "Environment variable not found" from that command. The same error from `npm run dev` is a real config problem, not this gotcha.

## 5. Verify

- `npm run build`, `npm run test`, `npm run lint` in every touched app.
- For anything in `apps/web`: use the `claude-in-chrome` tools to actually click through the change against the running local stack. Note which mock user role you need (`auth/routeRoles.ts`) to see the page.
- For API-only changes: exercise the endpoint with `curl` or via the browser's network tab.

Don't report a UI change as done without having clicked it.

## 6. Commit, push, open/update the PR

```bash
git add <files>
git commit -m "..."
git push -u origin feature/<issue-number>-<slug>
gh pr create --repo kelsier-corp/livingshop --base develop --head feature/<issue-number>-<slug> \
  --title "..." --body "..."
```

The PR body must include: what issue(s) it closes, what changed, and the **actual verification results** from step 5 (not just "tests pass" — what you clicked, what you saw, what data you checked). If updating an existing PR instead of opening a new one, use `gh pr edit <N> --body "..."`.

Stop and ask only if something is genuinely ambiguous in a way that changes scope or approach — not for small implementation details, which you should resolve with the most reasonable interpretation and note in the PR description.
