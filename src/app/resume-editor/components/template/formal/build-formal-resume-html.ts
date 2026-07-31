import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { Resume } from "@/types/resume";

import { escapeHtml, safeHref, GOOGLE_FONTS_LINKS } from "../html-utils";

/**
 * Builds a standalone HTML document for the Formal template — the same
 * single-column A4 sheet the PDF renders, expressed as plain HTML + CSS so the
 * file can be opened, emailed, or hosted on its own.
 *
 * Sizes are kept in the reference design's pixels here rather than converted to
 * points: unlike the PDF this is a real web page, so the sheet is simply the
 * 745 × 1054px the layout was designed at, and `@media print` scales it back to
 * A4.
 *
 * The constraints the PDF works under do not apply here — this is a browser, so
 * the contact separators become `::after`, the skills become a real two-column
 * grid, and the bullets become ordinary list markers.
 */

const SHEET_WIDTH_PX = 745;
const SHEET_HEIGHT_PX = 1054;

const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;
const SERIF_STACK = `"Noto Serif", "Times New Roman", Times, Georgia, serif`;

const INK = "rgb(2, 6, 27)";

const styles = (nameColor: string) => `
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
    font-size: 14px;
    line-height: 1.3;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    display: flex;
    flex-direction: column;
    width: ${SHEET_WIDTH_PX}px;
    min-height: ${SHEET_HEIGHT_PX}px;
    padding: 36px;
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

  .header { padding-bottom: 20px; }

  .header-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-bottom: 22px;
    text-align: center;
    border-bottom: 1.5px dashed #dadada;
  }

  .title-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .title-block .job-title {
    font-size: 16px;
    font-weight: 700;
  }

  .title-block .name {
    margin: 0;
    font-family: ${SERIF_STACK};
    font-size: 38px;
    font-weight: 700;
    line-height: 1.1;
    color: ${nameColor};
  }

  .contacts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: baseline;
    gap: 8px;
  }

  .contacts strong { font-weight: 700; }

  /* The dot rides on each item but the last, so the row never trails one. */
  .contacts li:not(:last-child)::after {
    content: "·";
    margin-left: 8px;
    color: #aaa;
  }

  /* Body ------------------------------------------------------------------ */

  .body {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  h2 {
    margin: 0;
    font-family: ${SERIF_STACK};
    font-size: 16px;
    font-weight: 700;
    line-height: 1.1;
    text-transform: uppercase;
  }

  .summary { padding-left: 30px; }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 18.4px;
    padding-left: 30px;
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .entry .headline {
    font-size: 16px;
    font-weight: 700;
  }

  .entry .headline.upper { text-transform: uppercase; }

  .entry .headline .date {
    font-weight: 400;
    text-transform: none;
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  /* Two columns of skills, the one place this file can use a real grid. */
  .skills {
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 9.2px;
    margin: 0;
    padding-left: 30px;
    list-style-type: disc;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding-left: 30px;
    list-style-type: disc;
  }

  .links a {
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
  }
`;

const header = (resume: Resume) => {
  const contacts = [
    { label: "Address:", value: resume.city },
    { label: "Email address:", value: resume.email },
    { label: "Phone number:", value: resume.phone },
  ]
    .map(({ label, value }) => `<li><strong>${label}</strong> ${escapeHtml(value)}</li>`)
    .join("");

  return `
      <header class="header">
        <div class="header-inner">
          <div class="title-block">
            <p class="job-title">${escapeHtml(resume.wantedJob)}</p>
            <h1 class="name">${escapeHtml(resume.name)}</h1>
          </div>

          <ul class="contacts list-reset">${contacts}</ul>
        </div>
      </header>`;
};

const summarySection = (profile: string) => `
        <section>
          <h2>Summary</h2>
          <p class="summary">${escapeHtml(profile)}</p>
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
              <p class="headline upper">${escapeHtml(jobTitle)}<span class="date"> | ${date}</span></p>
              <p class="company">${escapeHtml(company)}</p>
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

const educationSection = (resume: Resume) => {
  const entries = resume.educations
    .map(({ school, degree, major, timeline }) => {
      const subline = `${major ? `${major} | ` : ""}${formatDateRange(timeline, "In school")}`;

      return `
            <div class="entry">
              <p class="headline">${escapeHtml(`${school} | ${degree}`)}</p>
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

const buildFormalResumeHtml = ({
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
${visibility.educations ? educationSection(resume) : ""}
${visibility.skills ? skillsSection(resume) : ""}
${visibility.socialLinks ? linksSection(resume) : ""}
      </div>
    </main>
  </body>
</html>
`;
};

export default buildFormalResumeHtml;
