import formatDateRange from "@/lib/formatDateRange";
import { sectionsHtml } from "@/lib/resume-sections";
import { Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";

import {
  GOOGLE_FONTS_LINKS,
  bulletItemsHtml,
  escapeHtml,
  paragraphsHtml,
  safeHref,
} from "../html-utils";

/**
 * Builds a standalone HTML document for the Timeline template — the same banded
 * sheet the PDF renders, expressed as plain HTML + CSS so the file can be opened,
 * emailed, or hosted on its own.
 *
 * Sizes are kept in the reference design's pixels here rather than converted to
 * points: unlike the PDF this is a real web page, so the sheet is simply the
 * 745 × 1054px the layout was designed at, and `@media print` scales it back to
 * A4.
 *
 * This being real CSS, the timeline connector is drawn the way the reference
 * draws it — one absolutely positioned pseudo-element per entry, stretched to
 * bridge the gap down to the next dot. The PDF template has to build the same
 * line out of a stretched flex column instead; see `marker.tsx`.
 */

const SHEET_WIDTH_PX = 745;
const SHEET_HEIGHT_PX = 1054;

const INK = "#02061b";
const RULE_COLOR = "#e6e6e6";

/** The dot's diameter and the nudge that centres it on the date's first line. */
const MARKER_SIZE_PX = 8;
const MARKER_OFFSET_PX = 6;
const ENTRY_GAP_PX = 16;

const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;

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
    font-size: 14px;
    line-height: 1.51;
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

  /* The banded header: heavy rules above and below the identity. */
  .masthead {
    padding: 24px 0;
    border-top: 3px solid ${INK};
    border-bottom: 3px solid ${INK};
  }

  .masthead .name {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.17;
    text-transform: uppercase;
    color: ${accent};
  }

  .masthead .job-title {
    margin: 8px 0 0;
    text-transform: uppercase;
  }

  .columns {
    display: flex;
    flex: 1;
    justify-content: space-between;
    padding: 8px 0;
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 70%;
    padding-top: 24px;
    padding-right: 8px;
    border-right: 2px solid ${RULE_COLOR};
  }

  .rail {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 30%;
    padding-top: 24px;
    padding-left: 8px;
  }

  .footer {
    height: 3px;
    background: ${INK};
  }

  /*
   * The signature heading: the rule runs dark under the title, then continues in
   * light grey across the rest of the column. The title's own margin sits inside
   * the bordered box, which is what holds the dark rule off the letters.
   */
  .section-heading {
    display: flex;
    align-items: flex-end;
    width: 100%;
    padding-bottom: 16px;
  }

  .section-title { border-bottom: 2px solid ${INK}; }

  .section-title h2 {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 1.2px;
    line-height: 1.17;
    text-transform: uppercase;
  }

  .section-heading .rule {
    flex: 1;
    border-bottom: 2px solid ${RULE_COLOR};
  }

  p { margin: 0; }

  .list-reset {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: ${ENTRY_GAP_PX}px;
  }

  /* Two halves of equal width: dated marker on the left, detail on the right. */
  .entry { display: flex; }

  /* The gutter keeps a full date range off the job title in the other half. */
  .entry-left {
    position: relative;
    display: flex;
    flex: 1;
    align-items: flex-start;
    padding-right: 12px;
  }

  .entry-right {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
  }

  .marker {
    flex: none;
    width: ${MARKER_SIZE_PX}px;
    height: ${MARKER_SIZE_PX}px;
    margin-top: ${MARKER_OFFSET_PX}px;
    margin-right: 6px;
    border: 2px solid ${INK};
    border-radius: 50%;
    background: #fff;
  }

  /* Runs from under the dot down to the next one; the last entry has no line. */
  .entry:not(:last-child) .entry-left::before {
    content: "";
    position: absolute;
    top: ${MARKER_OFFSET_PX + MARKER_SIZE_PX}px;
    /* Reaches across the gap and the next dot's own offset, so the line meets it. */
    bottom: -${ENTRY_GAP_PX + MARKER_OFFSET_PX}px;
    left: ${(MARKER_SIZE_PX - 2) / 2}px;
    width: 2px;
    background: ${RULE_COLOR};
  }

  .entry-left .date {
    font-weight: 700;
    text-transform: uppercase;
  }

  .entry-right .title {
    font-weight: 700;
    text-transform: uppercase;
    color: ${accent};
  }

  .entry-right .company {
    padding-bottom: 3px;
    font-weight: 700;
  }

  .entry-right .school {
    margin-bottom: 8px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .entry-right .degree { font-weight: 700; }

  /* Education spaces its two lines with the school's own margin instead. */
  .entry-right.education { gap: 0; }

  .entry-right .url {
    color: inherit;
    text-decoration: underline;
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  .contacts {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .contacts li {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    column-gap: 6px;
    row-gap: 8px;
  }

  .pills li {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 15px;
    padding: 0 5px;
    border: 1px solid ${INK};
    border-radius: 19px;
    text-align: center;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rail a {
    color: inherit;
    text-decoration: underline;
  }

  /* Narrow screens: the fixed sheet would overflow, so the columns stack. */
  @media screen and (max-width: 700px) {
    body { padding: 0; }

    .page {
      width: 100%;
      min-height: 0;
      padding: 24px 16px;
    }

    .columns { display: block; }

    .main {
      width: 100%;
      padding-right: 0;
      border-right: 0;
    }

    .rail {
      width: 100%;
      padding-left: 0;
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

const heading = (title: string) => `
          <div class="section-heading">
            <div class="section-title"><h2>${title}</h2></div>
            <div class="rule"></div>
          </div>`;

const summarySection = (profile: string) => `
        <section>
${heading("Summary")}
          ${paragraphsHtml(profile)}
        </section>`;

const experienceSection = (resume: Resume) => {
  const entries = resume.employmentHistory
    .map(({ company, jobTitle, timeline, description }) => {
      const bullets = bulletItemsHtml(description);

      return `
            <article class="entry">
              <div class="entry-left">
                <span class="marker" aria-hidden="true"></span>
                <p class="date">${escapeHtml(formatDateRange(timeline, "Present"))}</p>
              </div>
              <div class="entry-right">
                <p class="title">${escapeHtml(jobTitle)}</p>
                <p class="company">${escapeHtml(company)}</p>
                ${bullets ? `<ul class="description">${bullets}</ul>` : ""}
              </div>
            </article>`;
    })
    .join("");

  return `
        <section>
${heading("Experience")}
          <div class="entries">${entries}</div>
        </section>`;
};

const projectsSection = (resume: Resume) => {
  const entries = filledProjects(resume.projects)
    .map(({ name, url, description }) => {
      const bullets = bulletItemsHtml(description);

      const href = safeHref(url);
      const link = href
        ? `<p><a class="url" href="${escapeHtml(href)}">${escapeHtml(url)}</a></p>`
        : "";

      return `
            <article class="entry">
              <div class="entry-left">
                <span class="marker" aria-hidden="true"></span>
              </div>
              <div class="entry-right">
                <p class="title">${escapeHtml(name)}</p>
                ${link}
                ${bullets ? `<ul class="description">${bullets}</ul>` : ""}
              </div>
            </article>`;
    })
    .join("");

  return `
        <section>
${heading("Projects")}
          <div class="entries">${entries}</div>
        </section>`;
};

const educationSection = (resume: Resume) => {
  const entries = resume.educations
    .map(({ school, degree, major, timeline }) => {
      const qualification = `${degree}${major ? `, ${major}` : ""}`;

      return `
            <article class="entry">
              <div class="entry-left">
                <span class="marker" aria-hidden="true"></span>
                <p class="date">${escapeHtml(formatDateRange(timeline, "In school"))}</p>
              </div>
              <div class="entry-right education">
                <p class="school">${escapeHtml(school)}</p>
                <p class="degree">${escapeHtml(qualification)}</p>
              </div>
            </article>`;
    })
    .join("");

  return `
        <section>
${heading("Education")}
          <div class="entries">${entries}</div>
        </section>`;
};

const rail = (resume: Resume) => {
  const { visibility } = resume;

  const skills = visibility.skills
    ? resume.skills.map(({ name }) => `<li>${escapeHtml(name)}</li>`).join("")
    : "";

  const links = visibility.socialLinks
    ? resume.socialLinks
        .map(({ name, url }) => {
          const href = safeHref(url);
          const label = escapeHtml(name);

          return href ? `<li><a href="${escapeHtml(href)}">${label}</a></li>` : `<li>${label}</li>`;
        })
        .join("")
    : "";

  return `
      <aside class="rail">
        <ul class="contacts list-reset">
          <li><span>${escapeHtml(resume.email)}</span></li>
          <li><span>${escapeHtml(resume.phone)}</span></li>
          <li><span>${escapeHtml(resume.city)}</span></li>
        </ul>
        ${
          skills
            ? `<section>
${heading("Skills")}
          <ul class="pills list-reset">${skills}</ul>
        </section>`
            : ""
        }
        ${
          links
            ? `<section>
${heading("Links")}
          <ul class="links list-reset">${links}</ul>
        </section>`
            : ""
        }
      </aside>`;
};

const buildTimelineResumeHtml = ({
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
      <header class="masthead">
        <h1 class="name">${escapeHtml(resume.name)}</h1>
        <p class="job-title">${escapeHtml(resume.wantedJob)}</p>
      </header>

      <div class="columns">
        <div class="main">
${sectionsHtml(resume, {
  profile: () => summarySection(resume.profile),
  employmentHistory: () => experienceSection(resume),
  projects: () => projectsSection(resume),
  educations: () => educationSection(resume),
})}
        </div>
${rail(resume)}
      </div>

      <div class="footer"></div>
    </main>
  </body>
</html>
`;
};

export default buildTimelineResumeHtml;
