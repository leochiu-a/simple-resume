import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { sectionsHtml } from "@/lib/resume-sections";
import { Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";

import { escapeHtml, paragraphsHtml, safeHref, GOOGLE_FONTS_LINKS } from "../html-utils";

/**
 * Builds a standalone HTML document for the Compact template — the same dense
 * single-column A4 sheet the PDF renders, expressed as plain HTML + CSS so the
 * file can be opened, emailed, or hosted on its own.
 *
 * Sizes are kept in the reference design's pixels here rather than converted to
 * points: unlike the PDF this is a real web page, so the sheet is simply the
 * 745 × 1054px the layout was designed at, and `@media print` scales it back to
 * A4.
 *
 * The constraints the PDF works under do not apply here — this is a browser, so
 * the contact separators become `::after`, the heading's trailing rule becomes a
 * flexed pseudo-element, and the bullets become ordinary list markers.
 */

const SHEET_WIDTH_PX = 745;
const SHEET_HEIGHT_PX = 1054;
const SHEET_PADDING_PX = 32;

const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;

const INK = "rgb(2, 6, 27)";
const MUTED = "rgb(94, 102, 116)";

const styles = (accent: string) => `
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
    color: ${INK};
    font-family: ${SANS_STACK};
    font-size: 12.5px;
    line-height: 1.28;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    display: flex;
    flex-direction: column;
    width: ${SHEET_WIDTH_PX}px;
    min-height: ${SHEET_HEIGHT_PX}px;
    padding: ${SHEET_PADDING_PX}px;
    background: #fff;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
  }

  p { margin: 0; }

  .list-reset {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Header ---------------------------------------------------------------- */

  .header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
  }

  .header .name {
    margin: 0;
    font-size: 23px;
    font-weight: 700;
    line-height: 1.15;
  }

  .contacts {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    color: ${MUTED};
  }

  /* The dot rides on each item but the last, so the line never trails one. */
  .contacts li:not(:last-child)::after {
    content: "·";
    margin-left: 6px;
  }

  /* Body ------------------------------------------------------------------ */

  .body {
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  /* The rule shares the heading's line and runs out to the right margin. */
  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 1.4px;
    line-height: 1.15;
    text-transform: uppercase;
    color: ${accent};
  }

  h2::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${accent};
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  /* Headline left, dates right. The headline's flex is what stops a long title running into them. */
  .entry .top-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .entry .headline {
    flex: 1;
    font-size: 13px;
  }

  .entry .headline strong { font-weight: 700; }

  .entry .date {
    font-size: 12px;
    color: ${MUTED};
  }

  .entry .date a {
    color: inherit;
    text-decoration: underline;
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 2px 0 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  /* Skills and links each run together on one wrapping line. */
  .inline-list a {
    color: inherit;
    text-decoration: underline;
  }

  /* Narrow screens: the fixed sheet would overflow, so it goes fluid. */
  @media screen and (max-width: 700px) {
    body { padding: 0; }

    .page {
      width: 100%;
      min-height: 0;
      padding: 24px 16px;
    }

    .entry .top-row {
      flex-direction: column;
      gap: 1px;
    }
  }

  @media print {
    @page { size: A4; margin: 0; }

    body { padding: 0; background: #fff; }

    .page {
      width: 100%;
      min-height: 100vh;
      box-shadow: none;
    }
  }
`;

const header = (resume: Resume) => {
  // A detail left blank is dropped, matching the PDF header — see `header.tsx`
  // for why an empty one is worse than a missing one.
  const details = [resume.wantedJob, resume.city, resume.email, resume.phone]
    .filter((value) => value.trim() !== "")
    .map((value) => `<li>${escapeHtml(value.trim())}</li>`)
    .join("");

  return `
      <header class="header">
        <h1 class="name">${escapeHtml(resume.name)}</h1>
        <ul class="contacts list-reset">${details}</ul>
      </header>`;
};

const summarySection = (profile: string) => `
        <section>
          <h2>Summary</h2>
          ${paragraphsHtml(profile, "summary")}
        </section>`;

const experienceSection = (resume: Resume) => {
  const entries = resume.employmentHistory
    .map(({ company, jobTitle, timeline, description }) => {
      const bullets = description
        .split(SPLIT_TEXT)
        .filter((item) => item.trim() !== "")
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");

      const date = escapeHtml(formatDateRange(timeline, "Present"));
      // The comma belongs to the company, so a role with no employer named does
      // not trail one.
      const employer = company ? `, ${escapeHtml(company)}` : "";

      return `
            <article class="entry">
              <div class="top-row">
                <p class="headline"><strong>${escapeHtml(jobTitle)}</strong>${employer}</p>
                <p class="date">${date}</p>
              </div>
              ${bullets ? `<ul class="description">${bullets}</ul>` : ""}
            </article>`;
    })
    .join("");

  return `
        <section>
          <h2>Experience</h2>
          <div class="entries">${entries}</div>
        </section>`;
};

const projectsSection = (resume: Resume) => {
  const entries = filledProjects(resume.projects)
    .map(({ name, url, description }) => {
      const bullets = description
        .split(SPLIT_TEXT)
        .filter((item) => item.trim() !== "")
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");

      const href = url ? safeHref(url) : null;
      const link = href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(url)}</a>`
        : url
          ? escapeHtml(url)
          : "";

      return `
            <article class="entry">
              <div class="top-row">
                <p class="headline"><strong>${escapeHtml(name)}</strong></p>
                ${link ? `<p class="date">${link}</p>` : ""}
              </div>
              ${bullets ? `<ul class="description">${bullets}</ul>` : ""}
            </article>`;
    })
    .join("");

  return `
        <section>
          <h2>Projects</h2>
          <div class="entries">${entries}</div>
        </section>`;
};

const educationSection = (resume: Resume) => {
  const entries = resume.educations
    .map(({ school, degree, major, timeline }) => {
      const qualification = [degree, major].filter((part) => part.trim() !== "").join(", ");

      return `
            <div class="entry">
              <div class="top-row">
                <p class="headline"><strong>${escapeHtml(school)}</strong>${
                  qualification ? ` — ${escapeHtml(qualification)}` : ""
                }</p>
                <p class="date">${escapeHtml(formatDateRange(timeline, "In school"))}</p>
              </div>
            </div>`;
    })
    .join("");

  return `
        <section>
          <h2>Education</h2>
          <div class="entries">${entries}</div>
        </section>`;
};

const skillsSection = (resume: Resume) => `
        <section>
          <h2>Skills</h2>
          <p class="inline-list">${resume.skills
            .map(({ name }) => escapeHtml(name))
            .join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</p>
        </section>`;

const linksSection = (resume: Resume) => {
  const items = resume.socialLinks
    .map(({ name, url }) => {
      const href = safeHref(url);
      const label = escapeHtml(name);

      return href ? `<a href="${escapeHtml(href)}">${label}</a>` : label;
    })
    .join("&nbsp;&nbsp;·&nbsp;&nbsp;");

  return `
        <section>
          <h2>Links</h2>
          <p class="inline-list">${items}</p>
        </section>`;
};

const buildCompactResumeHtml = ({
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
${header(resume)}

      <div class="body">
${sectionsHtml(resume, {
  profile: () => summarySection(resume.profile),
  employmentHistory: () => experienceSection(resume),
  projects: () => projectsSection(resume),
  educations: () => educationSection(resume),
  skills: () => skillsSection(resume),
  socialLinks: () => linksSection(resume),
})}
      </div>
    </main>
  </body>
</html>
`;
};

export default buildCompactResumeHtml;
