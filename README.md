# Simple RESUME

![](public/image.png)

A online tool to create a resume.

Online site: https://simple-resume-nu.vercel.app/resume-editor

## Features

- Create a resume easily.
- The resume data is stored in local storage.
- Build the resume by talking to a browser AI agent, via [WebMCP](#webmcp-experimental).

## Tech Stack

- Next.js 14
- React 18
- Tailwind
- Shadcn UI
- react-pdf/renderer

## Local Development

1. Download the repo git clone `gh repo clone leochiu-a/simple-resume`
2. Change the directory cd `simple-resume`
3. Install the dependency `pnpm i`
4. Start a development server `pnpm dev`
5. Open your browser and visit http://localhost:3000/resume-editor

## WebMCP (experimental)

The editor registers itself as a set of AI agent tools using
[WebMCP](https://webmachinelearning.github.io/webmcp/), so a browser agent can fill in the resume
instead of the user typing into every field. WebMCP is a W3C Web Machine Learning Community Group
draft — it is not a W3C Standard and the API is still moving.

Tools are registered on `document.modelContext` from
[`useResumeMcp`](src/app/resume-editor/hooks/useResumeMcp.ts) and defined in
[`resume-tools.ts`](src/app/resume-editor/webmcp/resume-tools.ts):

| Tool                                  | What the agent can do                       |
| ------------------------------------- | ------------------------------------------- |
| `get-resume`                          | Read the current resume, with entry indexes |
| `update-basic-info`, `update-profile` | Fill in the header and the summary          |
| `set-skills`, `set-social-links`      | Replace a whole list                        |
| `add/update/remove-employment`        | Manage the employment history               |
| `add/update/remove-education`         | Manage the education section                |
| `set-section-visibility`              | Show or hide a section                      |

### Trying it

WebMCP ships in Edge 147+, and in Chrome behind a flag: open `chrome://flags/#enable-webmcp-testing`,
set it to **Enabled**, and relaunch. The nav bar shows an **Agent ready** badge when registration
succeeded, and **Agent unavailable** when the browser has no WebMCP support. To invoke tools by hand,
use Chrome DevTools' WebMCP panel or the Model Context Tool Inspector extension.

Then ask the agent something like:

> Read my resume, then rewrite the profile summary for a staff frontend role and add my job at Vercel
> from March 2020 to now.

Automated coverage lives in [`e2e/webmcp.spec.ts`](e2e/webmcp.spec.ts), which stubs
`document.modelContext` so the tools can be exercised in plain Chromium.
