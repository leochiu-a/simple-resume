import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { sectionsHtml } from "@/lib/resume-sections";
import { Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";

import { escapeHtml, paragraphsHtml, safeHref, GOOGLE_FONTS_LINKS } from "../html-utils";

import { DATE_COLUMN_WIDTH } from "./units";

/**
 * Builds a standalone HTML document for the Dated template — the same A4 sheet
 * the PDF renders, expressed as plain HTML + CSS so the file can be opened,
 * emailed, or hosted on its own.
 *
 * Sizes are kept in the reference design's pixels here rather than converted to
 * points: unlike the PDF this is a real web page, so the sheet is simply the
 * 745 × 1054px the layout was designed at, and `@media print` scales it back to
 * A4.
 *
 * The constraints the PDF works under do not apply here — this is a browser, so
 * the contact separators become `::after`, the date columns become a real grid,
 * and the bullets become ordinary list markers. The grid in particular is why the
 * empty gutter each continuation bullet carries in the PDF has no counterpart
 * here: a grid places every row's second cell at the same edge without being told
 * twice.
 *
 * The one number the two renderings must agree on is the width of the date
 * column, so it is imported from `units.ts` rather than written out again.
 */

const SHEET_WIDTH_PX = 745;
const SHEET_HEIGHT_PX = 1054;

const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;
const SERIF_STACK = `"Noto Serif", "Times New Roman", Times, Georgia, serif`;

const INK = "rgb(2, 6, 27)";
const MUTED = "rgb(96, 102, 112)";
const HAIRLINE = "#d8d8d8";

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
    font-size: 13.5px;
    line-height: 1.32;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    display: flex;
    flex-direction: column;
    width: ${SHEET_WIDTH_PX}px;
    min-height: ${SHEET_HEIGHT_PX}px;
    padding: 38px;
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
    gap: 8px;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 1px solid ${HAIRLINE};
  }

  /* The gap clears the serif's descenders, which reach past the 1.15 line box. */
  .header .title-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .header .name {
    margin: 0;
    font-family: ${SERIF_STACK};
    font-size: 30px;
    font-weight: 700;
    line-height: 1.15;
  }

  .header .wanted-job {
    font-size: 14px;
    color: ${MUTED};
  }

  .contacts {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 7px;
    font-size: 13px;
  }

  /* The dot rides on each item but the last, so the row never trails one. */
  .contacts li:not(:last-child)::after {
    content: "·";
    margin-left: 7px;
    color: ${MUTED};
  }

  /* Body ------------------------------------------------------------------ */

  .body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h2 {
    margin: 0;
    padding-bottom: 6px;
    font-family: ${SERIF_STACK};
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 1.15;
    text-transform: uppercase;
    color: ${accent};
    border-bottom: 1px solid ${HAIRLINE};
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* The dated sections: years in the margin, entry beside them. */
  .dated {
    display: grid;
    grid-template-columns: ${DATE_COLUMN_WIDTH} 1fr;
    column-gap: 18px;
  }

  .dated .date {
    font-size: 12.5px;
    text-align: right;
    color: ${MUTED};
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .entry .headline {
    font-size: 14.5px;
    font-weight: 700;
  }

  .entry .subline {
    font-size: 13px;
    color: ${MUTED};
  }

  /* Projects have no date, so their url rides the headline instead. */
  .entry .top-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .entry .top-row .headline { flex: 1; }

  .entry .top-row .subline a {
    color: inherit;
    text-decoration: underline;
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px 0 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  /* Two columns of skills, the one place this file can use a real grid for them. */
  .skills {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    margin: 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding-left: 16px;
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

    /* A 22% date column on a phone leaves too little for the entry beside it, so
       the row stacks — the years above the job rather than out to its left. */
    .dated {
      grid-template-columns: 1fr;
      row-gap: 2px;
    }

    .dated .date { text-align: left; }

    .entry .top-row {
      flex-direction: column;
      gap: 2px;
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
  // A detail left blank is dropped, matching the PDF header — see `header.tsx`
  // for why an empty one is worse than a missing one.
  const contacts = [resume.city, resume.email, resume.phone]
    .filter((value) => value.trim() !== "")
    .map((value) => `<li>${escapeHtml(value.trim())}</li>`)
    .join("");

  return `
      <header class="header">
        <div class="title-block">
          <h1 class="name">${escapeHtml(resume.name)}</h1>
          <p class="wanted-job">${escapeHtml(resume.wantedJob)}</p>
        </div>

        <ul class="contacts list-reset">${contacts}</ul>
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

      return `
            <div class="dated">
              <p class="date">${date}</p>
              <article class="entry">
                <p class="headline">${escapeHtml(jobTitle)}</p>
                <p class="subline">${escapeHtml(company)}</p>
                ${bullets ? `<ul class="description">${bullets}</ul>` : ""}
              </article>
            </div>`;
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
                <p class="headline">${escapeHtml(name)}</p>
                ${link ? `<p class="subline">${link}</p>` : ""}
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
            <div class="dated">
              <p class="date">${escapeHtml(formatDateRange(timeline, "In school"))}</p>
              <div class="entry">
                <p class="headline">${escapeHtml(school)}</p>
                <p class="subline">${escapeHtml(subline)}</p>
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

const buildDatedResumeHtml = ({
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

export default buildDatedResumeHtml;
