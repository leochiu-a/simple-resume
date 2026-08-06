import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { Resume } from "@/types/resume";

import { escapeHtml, paragraphsHtml, safeHref, GOOGLE_FONTS_LINKS } from "../html-utils";
import panelColors from "./panel-color";

/**
 * Builds a standalone HTML document for the Modern template — the same two-column
 * A4 sheet the PDF renders, expressed as plain HTML + CSS so the file can be
 * opened, emailed, or hosted on its own.
 *
 * Sizes are kept in the reference design's pixels here rather than converted to
 * points: unlike the PDF this is a real web page, so the sheet is simply the
 * 745 × 1054px the layout was designed at, and `@media print` scales it back to
 * A4.
 */

const SHEET_WIDTH_PX = 745;
const SHEET_HEIGHT_PX = 1054;

const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;

/** The contact discs, matching the shapes the PDF template draws. */
const icon = (name: "mail" | "phone" | "location") => `
              <span class="icon ${name}" aria-hidden="true"><span></span></span>`;

const styles = (panel: { background: string; text: string }) => `
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
    color: #2e404a;
    font-family: ${SANS_STACK};
    font-size: 14px;
    line-height: 1.51;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    display: flex;
    width: ${SHEET_WIDTH_PX}px;
    min-height: ${SHEET_HEIGHT_PX}px;
    background: #fff;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 38%;
    padding: 25px 18px 25px 24px;
    background: ${panel.background};
    color: ${panel.text};
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 62%;
    padding: 25px 24px 25px 16px;
  }

  .identity {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .identity .name {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.17;
    text-transform: uppercase;
  }

  .identity .job-title {
    margin: 0;
    font-size: 16px;
  }

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0.8px;
    line-height: 1.17;
    text-transform: uppercase;
  }

  /* 8px of air above the rule, 16px below it. */
  h2 + .rule {
    height: 0;
    margin: 8px 0 16px;
    border: 0;
    border-top: 1px solid currentColor;
  }

  p { margin: 0; }

  .list-reset {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .details li {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${panel.text};
  }

  .icon > span { border: 1.2px solid ${panel.background}; }

  .icon.mail > span { width: 11px; height: 8px; border-radius: 1px; }
  .icon.phone > span { width: 7px; height: 11px; border-radius: 1.5px; }
  .icon.location > span { width: 8px; height: 8px; border-radius: 50%; }

  .bullets {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bullets li { display: flex; }

  .bullets li::before {
    content: "•";
    margin-right: 6px;
  }

  .sidebar a {
    color: inherit;
    text-decoration: underline;
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .entry-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .entry-header .title { font-weight: 700; }

  .description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding-left: 16px;
    list-style-type: disc;
  }

  /* Narrow screens: the fixed sheet would overflow, so the columns stack. */
  @media screen and (max-width: 700px) {
    body { padding: 0; }

    .page {
      display: block;
      width: 100%;
      min-height: 0;
    }

    .sidebar, .content { width: 100%; }
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

const sidebar = (resume: Resume) => {
  const { visibility } = resume;

  const links = visibility.socialLinks
    ? resume.socialLinks
        .map(({ name, url }) => {
          const href = safeHref(url);
          const label = escapeHtml(name);

          return href ? `<li><a href="${escapeHtml(href)}">${label}</a></li>` : `<li>${label}</li>`;
        })
        .join("")
    : "";

  const skills = visibility.skills
    ? resume.skills.map(({ name }) => `<li>${escapeHtml(name)}</li>`).join("")
    : "";

  return `
      <aside class="sidebar">
        <header class="identity">
          <h1 class="name">${escapeHtml(resume.name)}</h1>
          <p class="job-title">${escapeHtml(resume.wantedJob)}</p>
        </header>

        <section>
          <h2>Details</h2>
          <hr class="rule" />
          <ul class="details list-reset">
            <li>${icon("mail")}
              <span>${escapeHtml(resume.email)}</span>
            </li>
            <li>${icon("phone")}
              <span>${escapeHtml(resume.phone)}</span>
            </li>
            <li>${icon("location")}
              <span>${escapeHtml(resume.city)}</span>
            </li>
          </ul>
        </section>
        ${
          links
            ? `<section>
          <h2>Links</h2>
          <hr class="rule" />
          <ul class="bullets list-reset">${links}</ul>
        </section>`
            : ""
        }
        ${
          skills
            ? `<section>
          <h2>Skills</h2>
          <hr class="rule" />
          <ul class="bullets list-reset">${skills}</ul>
        </section>`
            : ""
        }
      </aside>`;
};

const summarySection = (profile: string) => `
        <section>
          <h2>Summary</h2>
          <hr class="rule" />
          ${paragraphsHtml(profile)}
        </section>`;

const experienceSection = (resume: Resume) => {
  const entries = resume.employmentHistory
    .map(({ company, jobTitle, timeline, description }) => {
      const bullets = description
        .split(SPLIT_TEXT)
        .filter((item) => item.trim() !== "")
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");

      return `
            <article class="entry">
              <div class="entry-header">
                <p class="date">${escapeHtml(formatDateRange(timeline, "Present"))}</p>
                <p class="title">${escapeHtml(jobTitle)}</p>
                <p class="location">${escapeHtml(company)}</p>
              </div>
              ${bullets ? `<ul class="description">${bullets}</ul>` : ""}
            </article>`;
    })
    .join("");

  return `
        <section>
          <h2>Experience</h2>
          <hr class="rule" />
          <div class="entries">${entries}</div>
        </section>`;
};

const educationSection = (resume: Resume) => {
  const entries = resume.educations
    .map(({ school, degree, major, timeline }) => {
      const title = `${degree}${major ? ` of ${major}` : ""}`;

      return `
            <div class="entry">
              <div class="entry-header">
                <p class="date">${escapeHtml(formatDateRange(timeline, "In school"))}</p>
                <p class="title">${escapeHtml(title)}</p>
                <p class="location">${escapeHtml(school)}</p>
              </div>
            </div>`;
    })
    .join("");

  return `
        <section>
          <h2>Education</h2>
          <hr class="rule" />
          <div class="entries">${entries}</div>
        </section>`;
};

const buildModernResumeHtml = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const title = `${resume.name} — ${resume.wantedJob}`;
  const panel = panelColors(backgroundColor);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    ${GOOGLE_FONTS_LINKS}
    <style>${styles(panel)}</style>
  </head>
  <body>
    <main class="page">
${sidebar(resume)}

      <div class="content">
${resume.visibility.profile ? summarySection(resume.profile) : ""}
${resume.visibility.employmentHistory ? experienceSection(resume) : ""}
${resume.visibility.educations ? educationSection(resume) : ""}
      </div>
    </main>
  </body>
</html>
`;
};

export default buildModernResumeHtml;
