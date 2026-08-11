import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { Resume } from "@/types/resume";

import { escapeHtml, paragraphsHtml, safeHref, GOOGLE_FONTS_LINKS } from "../html-utils";
import { LABEL_COLUMN_WIDTH } from "./units";

/**
 * Builds a standalone HTML document for the Ledger template — the same
 * label-gutter A4 sheet the PDF renders, expressed as plain HTML + CSS so the
 * file can be opened, emailed, or hosted on its own.
 *
 * Sizes are kept in the reference design's pixels here rather than converted to
 * points: unlike the PDF this is a real web page, so the sheet is simply the
 * 745 × 1054px the layout was designed at, and `@media print` scales it back to
 * A4.
 *
 * The constraints the PDF works under do not apply here — this is a browser, so
 * the section rows become a real grid, the skills a real two-column grid, and the
 * bullets ordinary list markers.
 */

const SHEET_WIDTH_PX = 745;
const SHEET_HEIGHT_PX = 1054;

const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;
const SERIF_STACK = `"Noto Serif", "Times New Roman", Times, Georgia, serif`;

const INK = "rgb(2, 6, 27)";
const MUTED = "#5b6070";

const styles = (accentColor: string) => `
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
    font-size: 13.5px;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    display: flex;
    flex-direction: column;
    width: ${SHEET_WIDTH_PX}px;
    min-height: ${SHEET_HEIGHT_PX}px;
    padding: 44px;
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

  /* The one row that ignores the gutter, so the rule reads as the sheet's edge. */
  .header {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 16px;
    margin-bottom: 22px;
    border-bottom: 2.5px solid ${accentColor};
  }

  .header .name {
    margin: 0;
    font-family: ${SERIF_STACK};
    font-size: 34px;
    font-weight: 700;
    line-height: 1.15;
  }

  .header .wanted-job {
    font-size: 15px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: ${MUTED};
  }

  /* No separator character: the column gap alone divides the details. */
  .contacts {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 14px;
    row-gap: 4px;
    margin-top: 2px;
    font-size: 12.5px;
    color: ${MUTED};
  }

  /* Body ------------------------------------------------------------------ */

  .body {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  /* The whole idea of the template: the title in the gutter, content beside it. */
  section {
    display: grid;
    grid-template-columns: ${LABEL_COLUMN_WIDTH} 1fr;
    align-items: start;
  }

  h2 {
    margin: 0;
    padding-right: 12px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    line-height: 1.15;
    text-transform: uppercase;
    color: ${accentColor};
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  /* The dates are pushed to the right margin, which straightens the column. */
  .entry .headline {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }

  .entry .headline .title {
    font-size: 14.5px;
    font-weight: 700;
  }

  .entry .headline .date {
    flex-shrink: 0;
    font-size: 12px;
    color: ${MUTED};
  }

  .entry .subline {
    font-size: 13px;
    color: ${MUTED};
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 5px 0 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  .description::marker, .skills::marker { color: ${MUTED}; }

  /* Two columns of skills, one of the places this file can use a real grid. */
  .skills {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 6px;
    column-gap: 10px;
    margin: 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin: 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  .links a {
    color: inherit;
    text-decoration: underline;
  }

  /* Narrow screens: the fixed sheet would overflow, so it goes fluid — and the
     gutter stops being one, since a 22% label column on a phone leaves too little
     for the text beside it. */
  @media screen and (max-width: 700px) {
    body { padding: 0; }

    .page {
      width: 100%;
      min-height: 0;
      padding: 24px 16px;
    }

    section {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    h2 { padding-right: 0; }

    .skills { grid-template-columns: 1fr; }
  }

  @media print {
    @page { size: A4; margin: 0; }

    body { padding: 0; background: #fff; }

    .page {
      width: 100%;
      min-height: 100vh;
      box-shadow: none;
    }

    /* A section must not be torn away from the title naming it. */
    section { break-inside: avoid; }
  }
`;

const header = (resume: Resume) => {
  // A detail left blank is dropped, matching the PDF header — kept in, it printed
  // as nothing but still claimed a column gap.
  const contacts = [resume.city, resume.email, resume.phone]
    .filter((value) => value.trim() !== "")
    .map((value) => `<li>${escapeHtml(value.trim())}</li>`)
    .join("");

  const wantedJob = resume.wantedJob.trim();

  return `
      <header class="header">
        <h1 class="name">${escapeHtml(resume.name)}</h1>
        ${wantedJob ? `<p class="wanted-job">${escapeHtml(wantedJob)}</p>` : ""}
        <ul class="contacts list-reset">${contacts}</ul>
      </header>`;
};

const summarySection = (profile: string) => `
        <section>
          <h2>Summary</h2>
          <div class="summary">${paragraphsHtml(profile)}</div>
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

      return `
            <article class="entry">
              <div class="headline">
                <p class="title">${escapeHtml(jobTitle)}</p>
                <p class="date">${date}</p>
              </div>
              <p class="subline">${escapeHtml(company)}</p>
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
  const entries = (resume.projects ?? [])
    .filter(({ name, description }) => name.trim() !== "" || description.trim() !== "")
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
              <div class="headline">
                <p class="title">${escapeHtml(name)}</p>
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
      const subline = `${degree}${major ? ` | ${major}` : ""}`;

      return `
            <div class="entry">
              <div class="headline">
                <p class="title">${escapeHtml(school)}</p>
                <p class="date">${escapeHtml(formatDateRange(timeline, "In school"))}</p>
              </div>
              <p class="subline">${escapeHtml(subline)}</p>
            </div>`;
    })
    .join("");

  return `
        <section>
          <h2>Education</h2>
          <div class="entries">${entries}</div>
        </section>`;
};

const skillsSection = (resume: Resume) => {
  const items = resume.skills.map(({ name }) => `<li>${escapeHtml(name)}</li>`).join("");

  return `
        <section>
          <h2>Skills</h2>
          <ul class="skills">${items}</ul>
        </section>`;
};

const linksSection = (resume: Resume) => {
  const items = resume.socialLinks
    .map(({ name, url }) => {
      const href = safeHref(url);
      const label = escapeHtml(name);

      return href ? `<li><a href="${escapeHtml(href)}">${label}</a></li>` : `<li>${label}</li>`;
    })
    .join("");

  return `
        <section>
          <h2>Links</h2>
          <ul class="links">${items}</ul>
        </section>`;
};

const buildLedgerResumeHtml = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const title = `${resume.name} — ${resume.wantedJob}`;
  const { visibility } = resume;

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
${visibility.profile ? summarySection(resume.profile) : ""}
${visibility.employmentHistory ? experienceSection(resume) : ""}
${visibility.projects ? projectsSection(resume) : ""}
${visibility.educations ? educationSection(resume) : ""}
${visibility.skills ? skillsSection(resume) : ""}
${visibility.socialLinks ? linksSection(resume) : ""}
      </div>
    </main>
  </body>
</html>
`;
};

export default buildLedgerResumeHtml;
