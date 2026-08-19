# Working on Open Resume

A local-first resume builder: a Next.js App Router app where the resume lives in the browser's local
storage and the AI features run on the device. See [README.md](README.md) for what it does from a
user's side.

## Commands

```bash
pnpm i          # Node 24, pnpm 10 (see engines / packageManager in package.json)
pnpm dev        # editor at http://localhost:3000/resume-editor
pnpm lint       # oxlint
pnpm format     # oxfmt  (pnpm format:check in CI)
pnpm test:e2e   # Playwright, specs in e2e/  (test:e2e:ui opens the runner)
```

CI runs typecheck, lint, format:check, build and the Playwright suite. A Husky hook runs
`oxlint --fix` and `oxfmt` over staged files, so a commit may amend your formatting.

Commits follow [conventional commits](https://www.conventionalcommits.org/) — commitlint enforces it.
Use a scope that reads as a place in the product (`fix(month-picker)`, `docs(readme)`), not a number.

## Two rules that must not be broken

**Never give the editor's form an `action`, a `method`, or a submit handler.** Nothing here is ever
submitted — the `<form>` only groups the fields and gives react-hook-form something to own, and every
change is saved to local storage as you type. A button inside a form with no `type` **is** a submit
button, and a programmatic click on one serialises every field into the query string, where name,
phone and profile reach the server in the request line and stay in browser history. For an app whose
whole promise is that the resume stays in the browser, that is the one navigation that must not be
possible. Every button carries `type="button"`; the `preventDefault` on the form is the backstop.

**Nothing in the editor's bar may have an accessible name containing "Open Resume"** other than the
wordmark itself. Two links in one bar whose names overlap are ambiguous both to read out and to
select.

## Things that look fine and are not

Each of these has already cost debugging time. They are silent — nothing throws and the tests pass.

| Do not                                              | Because                                                                                                                          |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `h-screen` on the editor shell                      | `100vh` is the _largest_ mobile viewport; the page hides under the address bar. Use `h-dvh`.                                     |
| Bare numbers for sizes in a template                | Points in the PDF, **pixels** in the preview — the layout shrinks by a quarter. Use `pt()`.                                      |
| A bordered element without `boxSizing`              | Yoga borders are inside the box, the browser's are outside. Preview-only size bug.                                               |
| Driving the hero's entrance from JS                 | An interrupted animation strands the landing page at `opacity: 0`. `.landing-rise` is CSS.                                       |
| Reusing the Prompt API session                      | The profile stays in context while a description is rewritten. Clone per run.                                                    |
| Tinting the resume sheet                            | It is paper-white in both themes because that is what the PDF is.                                                                |
| `lineHeight` without a `fontSize` in the same block | @react-pdf measures it against its own 18pt default, not the inherited size. Correct in the preview, ~165% too loose in the PDF. |

## Where the detail lives

| Doc                                          | Covers                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [docs/interface.md](docs/interface.md)       | The `--c-*` palette both surfaces alias, dark mode, typography, and the layout of the landing page and the editor |
| [docs/templates.md](docs/templates.md)       | Adding a template, the fonts (Latin and Chinese), and why the preview is not a rasterised PDF                     |
| [docs/on-device-ai.md](docs/on-device-ai.md) | Translation, rewriting, the `ResumeDoc` shape and its write invariant                                             |
| [docs/webmcp.md](docs/webmcp.md)             | The agent tool reference and conventions                                                                          |

Design rationale belongs next to the code it defends. If a paragraph only matters while someone is
editing one file, it is a comment in that file — not a section of the README.
