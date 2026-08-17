import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";
import { sectionsHtml } from "@/lib/resume-sections";
import { Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";

import { escapeHtml, paragraphsHtml, safeHref, GOOGLE_FONTS_LINKS } from "../html-utils";

import bannerColors, { BannerColors } from "./banner-color";

/**
 * Builds a standalone HTML document for the Banner template — the same
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
 * grid, and the bullets become ordinary list markers. The band's ink is still
 * picked by the same `bannerColors` the document uses, so the two renderings
 * cannot disagree about when a fill is too light to print white on.
 *
 * `print-color-adjust` is what makes the band survive printing: a browser drops
 * background fills from a printout by default, and this sheet's whole design is
 * one.
 */

const SHEET_WIDTH_PX = 745;
const SHEET_HEIGHT_PX = 1054;
const SHEET_PADDING_PX = 36;

const SANS_STACK = `"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;
const SERIF_STACK = `"Noto Serif", "Times New Roman", Times, Georgia, serif`;

const INK = "rgb(2, 6, 27)";
const MUTED = "rgb(90, 98, 112)";

const styles = (colors: BannerColors) => `
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
    line-height: 1.35;
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

  /* Band ------------------------------------------------------------------ */

  /* Pulled back out over the sheet's own padding, so the colour reaches the paper. */
  .band {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: -${SHEET_PADDING_PX}px -${SHEET_PADDING_PX}px 26px;
    padding: 32px ${SHEET_PADDING_PX}px;
    background: ${colors.background};
    color: ${colors.text};
  }

  /* The gap clears the serif's descenders, which reach past the 1.15 line box. */
  .band .title-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .band .name {
    margin: 0;
    font-family: ${SERIF_STACK};
    font-size: 36px;
    font-weight: 700;
    line-height: 1.15;
  }

  .band .wanted-job {
    font-size: 14px;
    letter-spacing: 1.6px;
    line-height: 1.15;
    text-transform: uppercase;
  }

  .band .rule {
    height: 1px;
    background: ${colors.muted};
  }

  .contacts {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 8px;
    font-size: 13px;
  }

  /* The dot rides on each item but the last, so the row never trails one. */
  .contacts li:not(:last-child)::after {
    content: "·";
    margin-left: 8px;
    color: ${colors.muted};
  }

  /* Body ------------------------------------------------------------------ */

  .body {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.8px;
    line-height: 1.15;
    text-transform: uppercase;
  }

  /* More leading than the page's, for the one block of running prose on it. */
  .summary { line-height: 1.5; }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .entry {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  /* Headline left, dates right. The headline's flex is what stops a long title running into them. */
  .entry .top-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .entry .headline {
    flex: 1;
    font-size: 15px;
    font-weight: 700;
  }

  .entry .date {
    font-size: 13px;
    color: ${MUTED};
  }

  .entry .date a {
    color: inherit;
    text-decoration: underline;
  }

  .entry .subline {
    font-size: 13.5px;
    color: ${MUTED};
  }

  .description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px 0 0;
    padding-left: 18px;
    list-style-type: disc;
  }

  /* Two columns of skills, the one place this file can use a real grid. */
  .skills {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    margin: 0;
    padding-left: 18px;
    list-style-type: disc;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding-left: 18px;
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
      padding: 0 16px 24px;
    }

    /* The sheet has no top padding left to bleed over, only the sides. */
    .band {
      margin: 0 -16px 24px;
      padding: 28px 16px;
    }

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
  // A detail left blank is dropped, matching the PDF band — see `header.tsx` for
  // why an empty one is worse than a missing one.
  const contacts = [resume.city, resume.email, resume.phone]
    .filter((value) => value.trim() !== "")
    .map((value) => `<li>${escapeHtml(value.trim())}</li>`)
    .join("");

  return `
      <header class="band">
        <div class="title-block">
          <h1 class="name">${escapeHtml(resume.name)}</h1>
          <p class="wanted-job">${escapeHtml(resume.wantedJob)}</p>
        </div>

        <div class="rule"></div>

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
            <article class="entry">
              <div class="top-row">
                <p class="headline">${escapeHtml(jobTitle)}</p>
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
              <div class="top-row">
                <p class="headline">${escapeHtml(school)}</p>
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

const buildBannerResumeHtml = ({
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
    <style>${styles(bannerColors(backgroundColor))}</style>
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

export default buildBannerResumeHtml;
