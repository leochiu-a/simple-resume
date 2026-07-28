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

Twelve tools cover reading the resume plus writing every section — the header, the summary, skills,
social links, employment history, education, and per-section visibility.

WebMCP ships in Edge 147+, and in Chrome behind a flag: open `chrome://flags/#enable-webmcp-testing`,
set it to **Enabled**, and relaunch. The nav bar shows an **Agent ready** badge when registration
succeeded, and **Agent unavailable** when the browser has no WebMCP support. Then ask the agent
something like:

> Read my resume, then rewrite the profile summary for a staff frontend role and add my job at Vercel
> from March 2020 to now.

**[Full tool reference and conventions → docs/webmcp.md](docs/webmcp.md)**

Automated coverage lives in [`e2e/webmcp.spec.ts`](e2e/webmcp.spec.ts), which stubs
`document.modelContext` so the tools can be exercised in plain Chromium.
