---
name: pr-review
description: Deep review of a GitHub pull request — reads the PR description, traces it back to the spec and acceptance criteria in the issue tracker, absorbs the project's architecture docs and house rules, hunts for verified defects, and posts one summary comment on the PR. Use this whenever the user mentions reviewing a PR or pull request, says "review #N" or "review my PR", asks whether a branch does what its ticket asked, wants a second pair of eyes on changes before merge, or asks for findings to be posted to GitHub — even if they never say the word "review".
---

# PR review

A review is only worth the author's attention if it says something they couldn't see themselves. Two things get you there, and both happen *before* you open the diff: knowing what the PR was **supposed** to do (the spec), and knowing what this codebase **considers correct** (the docs). Skip either and you produce the generic review everyone ignores — "consider adding error handling", "maybe extract this into a helper" — findings that are technically true, locally useless, and indistinguishable from a linter.

So the order below is load-bearing. Resist the pull to jump straight to the diff.

## 1. Resolve the PR

The user may pass a number, a URL, or nothing. With nothing, use the current branch's PR:

```bash
gh pr view --json number,title,body,url,headRefName,baseRefName,additions,deletions,changedFiles,commits,isDraft,state
gh pr diff <n> --name-only        # surface area first
gh pr diff <n>                    # the diff itself
```

If the branch has no PR, say so and ask whether to review the branch against `main` instead — everything below still works with `git diff main...HEAD`.

Check the size before you commit to an approach. Under ~40 changed files, read the whole diff. Above that, work file-group by file-group (routes, then lib, then components…) so no single read swamps your context, and say in the comment which groups you covered in depth.

## 2. Read the PR description — as a claim, not as fact

The description is the author's account of their own work. It's the most useful thing in the PR *and* the thing most likely to be quietly wrong: it describes the plan, and the code is what actually shipped. A description saying "updated all 6 call sites" is a testable assertion — go count them.

Pull out and keep: the stated scope, the spec/ticket paths it references, any "worth a reviewer's attention" notes (authors flag their own weak spots — start there), and every factual claim you can check against the diff. A claim that turns out false is one of the highest-value findings you can report, because nobody else will catch it.

## 3. Find the spec — the scope contract

Without a spec you can only review *how* the code is written, never *whether it's the right code*. Look, in order:

1. Paths named in the PR body or commit messages.
2. `docs/agents/issue-tracker.md` — it defines where this repo keeps issues. Follow it. In this repo that means `.scratch/<feature-slug>/spec.md` plus one file per ticket at `.scratch/<feature-slug>/issues/NN-<slug>.md`.
3. A feature slug matching the branch name (`feat/marketing-app-split` → `.scratch/marketing-app-split/`).
4. `ls` the issue-tracker root and match by topic.

Read the feature `spec.md` and **every referenced ticket in full**. Each ticket's `## Acceptance criteria` is the checklist the PR is graded against — copy it out; step 6 walks it item by item. Ticket `## Comments` often record what the implementer decided along the way, which tells you whether a deviation was considered or accidental.

If there's genuinely no spec, say so in the comment and review on correctness and architecture alone. Don't invent scope the author never signed up for — inventing requirements is how a review loses the author's trust.

## 4. Load the project context

This is the step people skip and the one that decides whether the review is any good. Without it you flag house style as a mistake, and you miss the rules that exist *only* in the docs — which are exactly the violations no tool will catch.

Read in full, always:

- **`CLAUDE.md`** (or `AGENTS.md` / `CONTRIBUTING.md`). Treat its **MANDATORY**, **NEVER**, **STRICT**, and "What NOT to do" sections as hard rules: a breach there is a real finding with a citation, not a matter of taste.
- **Every file in `docs/adr/`**. ADRs are short and normative. A PR that contradicts an accepted ADR is a blocker even when the code is flawless — that's a decision being reversed without a decision.

Read by relevance:

- **`docs/ARCHITECTURE.md`**, **`docs/TECH_STACK.md`**, root `spec.md`. Grep the headings first (`grep -n '^#' docs/ARCHITECTURE.md`), then read every section covering ground the diff touches. If the diff spans more than about five areas, read them whole — at that breadth you'll need most of it anyway.

Before opening the diff, write yourself a short **house rules** list: the specific, checkable rules this repo has that a generic reviewer wouldn't know. In this repo those include design tokens over hardcoded hex/px, no `any`, named exports only, no hardcoded German strings (i18n keys at `de`/`en` parity), never editing base UI primitives to suit one screen, cross-app links via `marketingUrl()` rather than a literal domain, and `getValues()` over DOM queries in forms. Deriving this list from the docs — not from memory — is what keeps the skill honest in a repo you've never seen.

## 5. Read the changed files, not just the hunks

Open each changed file at full length. The context around a hunk is where you learn that the null case you were about to flag is handled four lines down (drop the finding) — or that it genuinely isn't (now you have a real one). Reviewing hunks in isolation is the main source of confident, wrong review comments.

While reading, run these passes. `references/defect-hunting.md` has the per-area checklist — read it when the diff touches API routes, database/Prisma, forms, auth, PDF generation, or React data flow.

- **Spec conformance** — walk the acceptance criteria one at a time.
- **Correctness** — what input or state makes this behave wrong? Error paths, empty/null, off-by-one, async races, unhandled rejections.
- **House rules** — the list from step 4, with citations.
- **Blast radius** — does this change a shared signature, route, env var, or DB column with call sites the diff didn't touch? `grep` for them. Missed call sites are a classic high-severity, easily-verified finding.
- **Security & data** — authz on new endpoints, secrets, PII, injection, client-side trust.
- **Tests** — is the new logic covered? Does an existing test now assert the old behaviour?

## 6. Verify every finding before it goes in the comment

The difference between a review people act on and one they skim is false-positive rate. One confidently wrong finding makes the author doubt all the others, so it's worth being strict here.

For each candidate, do three things:

1. **State the failure concretely** — specific inputs or state, leading to a specific wrong outcome. If you can't name the trigger, you have a feeling, not a finding.
2. **Go back to the file and try to disprove it.** Check the caller, the type, the default, the guard above. Many candidates die here, and that's the step working.
3. **Drop what doesn't survive.** Don't soften it into "consider looking at…" — an unverified finding dressed as a suggestion is still noise.

Then rank what's left:

| | Bar |
|---|---|
| 🔴 **Blocker** | Merging causes real harm: a user-visible bug, data loss, a security hole, a missing acceptance criterion, or a reversal of an accepted ADR. |
| 🟡 **Should fix** | A genuine defect, bounded: an edge case, an untested new code path, a house-rule breach that will get copied. |
| 🔵 **Nit** | Naming, clarity, taste. The author may ignore it. More than ~5 and you're padding — cut to the best three. |

Three verified blockers beat fifteen observations. If the honest answer is that the PR is clean, say that; a clean review from someone who clearly read the spec and the docs is valuable information.

## 7. Post the comment

Print the full review in the terminal first so the user sees exactly what's going out, then post it. Write the body to a file and use `--body-file` — review bodies contain backticks, `$`, and code fences that shell quoting mangles.

```bash
gh pr comment <n> --body-file /path/to/review.md
```

If your last comment on this PR carries the `<!-- pr-review -->` marker, use `gh pr comment <n> --edit-last --body-file …` instead, so re-reviews update in place rather than stacking. Report the comment URL. Mention it can be edited or deleted if anything looks off.

### Comment format

```markdown
<!-- pr-review -->
## 🔍 PR Review — #<n> <title>

**Spec:** `<path>` (tickets 03, 04) · **Diff:** <N> files, +<A>/−<D> · **Context:** CLAUDE.md, ADR-0001, ARCHITECTURE.md §Auth
**Verdict:** <one sentence — ship it / ship after the blockers / needs another pass>

### Scope vs. spec
| Acceptance criterion | Status |
|---|---|
| No hardcoded app-origin literals remain | ✅ |
| Deleted-account users land on marketing home | ⚠️ partial — `settings/page.tsx:287` still… |
| Not-found "home" resolves correctly | ❌ missing |
| — | ➕ not in spec: pnpm migration (flagged, seems deliberate) |

### 🔴 Blockers
**1. Stripe success URL still points at the deleted `/dashboard` route** — `src/app/api/stripe/checkout/route.ts:41`
Every user returning from a successful payment lands on a 404, after being charged. `successUrl` was not updated when `(app)/dashboard/page.tsx` moved to `(app)/page.tsx`.
```ts
successUrl: `${appUrl()}/dashboard`  // → appUrl('/')
```

### 🟡 Should fix
**2. …** — `path:line`
…

### 🔵 Nits
- `path:line` — …

### ✅ Worth noting
<1–3 lines, only when genuine: what the author got right, especially call sites or edge cases the spec missed.>
```

Every finding carries a `file:line`, a concrete consequence, and — where the fix is short — the corrected code. A finding the author has to go hunting for is a finding they'll defer.

## 8. Offer `/code-review`

After posting, offer once:

> Want me to also run `/code-review` against the merge-base? It runs Standards and Spec as separate sub-agents and may surface smells I didn't weight the same way.

If they accept, invoke the `code-review` skill with the PR's base branch as the fixed point. Fold anything genuinely new into a **follow-up** comment headed `### Addendum — /code-review`; don't re-post findings you already made. If it surfaces nothing new, say that plainly rather than padding the PR with a second comment.
