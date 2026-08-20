import formatDateRange from "@/lib/formatDateRange";
import { sectionsHtml } from "@/lib/resume-sections";
import { CustomSection, Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";

import {
  GOOGLE_FONTS_LINKS,
  bulletItemsHtml,
  escapeHtml,
  paragraphsHtml,
  safeHref,
} from "../html-utils";

/**
 * Builds a standalone HTML document for a resume — the same A4 layout the PDF
 * template renders, expressed as plain HTML + CSS so the file can be opened,
 * emailed, or hosted on its own.
 *
 * The only thing it fetches is the Google Fonts stylesheet for Noto Sans/Serif;
 * every font family falls back to a system stack, so the document still reads
 * correctly offline.
 *
 * The @react-pdf sizes are in points, so the CSS below stays in `pt` too. The
 * two `transform: scale(...)` tricks in the PDF typography (SmallText 0.9,
 * SubText 0.7) are folded into the font sizes instead, because scaling text in
 * a browser leaves the original box behind.
 */

const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;

const SERIF_STACK = `"Noto Serif", Georgia, "Times New Roman", serif`;
const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;

const styles = (backgroundColor: string) => `
  *, *::before, *::after { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
  }

  body {
    display: flex;
    justify-content: center;
    padding: 24px 16px;
    background: #f1f1f1;
    color: #000;
    font-family: ${SANS_STACK};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    position: relative;
    overflow: hidden;
    width: ${A4_WIDTH_PT}pt;
    min-height: ${A4_HEIGHT_PT}pt;
    background: #fff;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
  }

  .sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 190pt;
    padding: 40pt 20pt;
    background: ${backgroundColor};
    color: #fff;
  }

  .identity { padding: 0 20pt; text-align: center; }

  .identity .name {
    margin: 0;
    font-family: ${SERIF_STACK};
    font-size: 16pt;
    font-weight: 700;
    line-height: 1.5;
  }

  .identity .rule {
    width: 12pt;
    height: 1pt;
    margin: 10pt auto;
    background: #3b7269;
  }

  .sidebar-sections {
    display: flex;
    flex-direction: column;
    gap: 20pt;
    align-self: flex-start;
    margin-top: 20pt;
    margin-left: 20pt;
  }

  .content { margin: 40pt 42px 40pt 220pt; }

  .block { margin-bottom: 12pt; }

  h2 {
    margin: 0 0 3pt;
    font-family: ${SERIF_STACK};
    font-weight: 700;
    line-height: 1.5;
  }

  .content h2 { font-size: 13pt; }
  .sidebar h2 { font-size: 11pt; }

  p { margin: 0; }

  .text { font-size: 9pt; line-height: 1.6; }
  .small { font-size: 8.1pt; line-height: 1.4; }

  .meta {
    color: #818487;
    font-size: 6.3pt;
    letter-spacing: 1.05pt;
    line-height: 1.6;
  }

  .sidebar .meta { color: #fff; }

  .list-reset {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .stack { display: flex; flex-direction: column; }
  .stack-tight { gap: 2pt; }
  .stack-loose { gap: 8pt; }
  .stack-skills { gap: 6pt; }

  .email { text-decoration: underline; }

  .sidebar a {
    color: #fff;
    text-decoration: underline;
  }

  .jobs { display: flex; flex-direction: column; gap: 12pt; }

  .job-heading { margin-bottom: 8pt; }

  .bullets {
    margin: 0;
    padding-left: 12px;
    list-style: none;
  }

  .bullets li {
    display: flex;
    gap: 4pt;
  }

  .bullets li::before {
    content: "•";
    font-weight: 700;
  }

  .education-item { margin-bottom: 12pt; }

  strong { font-weight: 700; }

  /* Narrow screens: the fixed A4 sheet would overflow, so the sidebar stacks
     above the content instead. */
  @media screen and (max-width: 700px) {
    body { padding: 0; }

    .page {
      width: 100%;
      min-height: 0;
    }

    .sidebar {
      position: static;
      width: 100%;
      padding: 32pt 24pt;
    }

    .sidebar-sections { margin-left: 0; }

    .content { margin: 32pt 24pt; }
  }

  @media print {
    @page { size: A4; margin: 0; }

    body { padding: 0; background: #fff; }

    .page {
      width: 100%;
      min-height: ${A4_HEIGHT_PT}pt;
      box-shadow: none;
    }

    .sidebar {
      position: absolute;
      width: 190pt;
      padding: 40pt 20pt;
    }

    .sidebar-sections { margin-left: 20pt; }

    .content { margin: 40pt 42px 40pt 220pt; }
  }
`;

const infoSection = (resume: Resume) => {
  const { visibility } = resume;

  const links = visibility.socialLinks
    ? resume.socialLinks
        .map(({ name, url }) => {
          const href = safeHref(url);
          const label = escapeHtml(name);

          return href
            ? `<li class="small"><a href="${escapeHtml(href)}">${label}</a></li>`
            : `<li class="small">${label}</li>`;
        })
        .join("")
    : "";

  const skills = visibility.skills
    ? resume.skills.map(({ name }) => `<li class="small">${escapeHtml(name)}</li>`).join("")
    : "";

  return `
      <aside class="sidebar">
        <header class="identity">
          <h1 class="name">${escapeHtml(resume.name)}</h1>
          <div class="rule"></div>
          <p class="meta">${escapeHtml(resume.wantedJob)}</p>
        </header>

        <div class="sidebar-sections">
          <section>
            <h2>Details</h2>
            <ul class="stack stack-tight list-reset">
              <li class="small">${escapeHtml(resume.city)}</li>
              <li class="small">${escapeHtml(resume.phone)}</li>
              <li class="small email">${escapeHtml(resume.email)}</li>
            </ul>
          </section>
          ${
            links
              ? `<section>
            <h2>Links</h2>
            <ul class="stack stack-loose list-reset">${links}</ul>
          </section>`
              : ""
          }
          ${
            skills
              ? `<section>
            <h2>Skills</h2>
            <ul class="stack stack-skills list-reset">${skills}</ul>
          </section>`
              : ""
          }
        </div>
      </aside>`;
};

const profileSection = (profile: string) => `
        <section class="block">
          <h2>Profile</h2>
          ${paragraphsHtml(profile, "text")}
        </section>`;

const employmentHistorySection = (resume: Resume) => {
  const jobs = resume.employmentHistory
    .map(({ company, jobTitle, timeline, description }) => {
      const bullets = bulletItemsHtml(description, "text");

      return `
            <article>
              <p class="text job-heading">
                <strong>${escapeHtml(jobTitle)}, ${escapeHtml(company)}</strong>
                <br />
                <span class="meta">${escapeHtml(formatDateRange(timeline, "Present"))}</span>
              </p>
              ${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
            </article>`;
    })
    .join("");

  return `
        <section class="block">
          <h2>Employment History</h2>
          <div class="jobs">${jobs}</div>
        </section>`;
};

const projectsSection = (resume: Resume) => {
  const items = filledProjects(resume.projects)
    .map(({ name, url, description }) => {
      const bullets = bulletItemsHtml(description, "text");

      const href = url ? safeHref(url) : null;
      const link = href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(url)}</a>`
        : url
          ? escapeHtml(url)
          : "";

      return `
            <article>
              <p class="text job-heading">
                <strong>${escapeHtml(name)}</strong>
                ${link ? `<br /><span class="meta">${link}</span>` : ""}
              </p>
              ${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
            </article>`;
    })
    .join("");

  return `
        <section class="block">
          <h2>Projects</h2>
          <div class="jobs">${items}</div>
        </section>`;
};

const educationSection = (resume: Resume) => {
  const educations = resume.educations
    .map(({ school, degree, major, timeline }) => {
      const heading = `${degree}${major ? ` of ${major}` : ""}, ${school}`;

      return `
            <div class="education-item">
              <p class="text"><strong>${escapeHtml(heading)}</strong></p>
              <p class="meta">${escapeHtml(formatDateRange(timeline, "In school"))}</p>
            </div>`;
    })
    .join("");

  return `
        <section class="block">
          <h2>Education</h2>
          ${educations}
        </section>`;
};

/**
 * A section the user named. Untitled prints nothing at all, exactly as it draws
 * nothing on the sheet — see the template's `custom-section.tsx`.
 */
const customSection = (custom: CustomSection) => `
        <section class="block">
          <h2>${escapeHtml(custom.title)}</h2>
          <ul class="bullets">${bulletItemsHtml(custom.description)}</ul>
        </section>`;

const buildResumeHtml = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const title = `${resume.name} — ${resume.wantedJob}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    ${GOOGLE_FONTS_LINKS}
    <style>${styles(backgroundColor)}</style>
  </head>
  <body>
    <main class="page">
${infoSection(resume)}

      <div class="content">
${sectionsHtml(
  resume,
  {
    profile: () => profileSection(resume.profile),
    employmentHistory: () => employmentHistorySection(resume),
    projects: () => projectsSection(resume),
    educations: () => educationSection(resume),
  },
  customSection,
)}
      </div>
    </main>
  </body>
</html>
`;
};

export default buildResumeHtml;
