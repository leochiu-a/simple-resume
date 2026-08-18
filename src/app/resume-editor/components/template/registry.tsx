import { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import { ALL_SECTIONS, MAIN_COLUMN_SECTIONS } from "@/lib/resume-sections";
import { Resume, SectionId } from "@/types/resume";

import ClassicTemplate from "./classic/classic-template";
import buildClassicResumeHtml from "./classic/build-classic-resume-html";
import ModernTemplate from "./modern/modern-template";
import buildModernResumeHtml from "./modern/build-modern-resume-html";
import { DEFAULT_PANEL_COLOR } from "./modern/panel-color";
import FormalTemplate from "./formal/formal-template";
import buildFormalResumeHtml from "./formal/build-formal-resume-html";
import TimelineTemplate from "./timeline/timeline-template";
import buildTimelineResumeHtml from "./timeline/build-timeline-resume-html";
import LedgerTemplate from "./ledger/ledger-template";
import buildLedgerResumeHtml from "./ledger/build-ledger-resume-html";
import BannerTemplate from "./banner/banner-template";
import buildBannerResumeHtml from "./banner/build-banner-resume-html";
import { DEFAULT_BANNER_COLOR } from "./banner/banner-color";
import CompactTemplate from "./compact/compact-template";
import buildCompactResumeHtml from "./compact/build-compact-resume-html";
import DatedTemplate from "./dated/dated-template";
import buildDatedResumeHtml from "./dated/build-dated-resume-html";

/**
 * Every template the editor can render. A template owns both of its outputs — the
 * @react-pdf document (which also drives the on-screen preview) and the
 * standalone HTML export — so adding one means adding a single entry here.
 */

export interface TemplateProps {
  resume: Resume;
  backgroundColor: string;
}

export interface TemplateDefinition {
  id: string;
  label: string;
  description: string;
  /** The colour the picker starts on, since the templates tint different areas. */
  defaultColor: string;
  /**
   * The sections this template lays out in the flow `sectionOrder` governs.
   *
   * Two-column templates own only their main column: skills and links sit in a
   * sidebar whose arrangement is part of the design. The form reads this to mark
   * those two "Sidebar" on their headings — arranging them is still allowed and
   * still stored, it simply has nothing to move while this template is chosen.
   */
  orderedSections: readonly SectionId[];
  /**
   * Whether the PDF still reads as a resume once a machine strips the layout off
   * it.
   *
   * An applicant tracking system never sees the page — it sees the string a text
   * extractor pulls out of the PDF, and a template can lose the parse in ways
   * that are invisible on paper. Wide `letterSpacing` is the one that bites: the
   * gaps grow past what the extractor reads as a kern and every glyph comes out
   * as its own word, so a job title lands as "S e n i o r j o b" and matches no
   * opening. A link whose only URL lives in the annotation rather than in the
   * text is the other — most parsers never open annotations, so the profile is
   * simply absent.
   *
   * Set this from what a text extractor actually returns for the template, not
   * from how it looks: download its PDF, pull the text out, and check that the
   * job title, the dates, the skills and every URL survive as searchable
   * strings. Two columns are fine — the sidebar comes out as one block ahead of
   * the main column, which reads correctly.
   */
  atsSafe: boolean;
  render: (props: TemplateProps) => ReactElement<DocumentProps>;
  buildHtml: (props: TemplateProps) => string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Serif headings on a full-height colour sidebar.",
    defaultColor: "#094C42",
    // The only one that does not survive extraction: `subText` tracks its type
    // 1.5pt apart, which splits the job title, every date range and the project
    // URL into single characters, and its social links carry the profile name
    // with the URL only in the annotation.
    orderedSections: MAIN_COLUMN_SECTIONS,
    atsSafe: false,
    render: (props) => <ClassicTemplate {...props} />,
    buildHtml: buildClassicResumeHtml,
  },
  {
    id: "modern",
    label: "Modern",
    description: "Two columns, uppercase headings under hairline rules.",
    defaultColor: DEFAULT_PANEL_COLOR,
    orderedSections: MAIN_COLUMN_SECTIONS,
    atsSafe: true,
    render: (props) => <ModernTemplate {...props} />,
    buildHtml: buildModernResumeHtml,
  },
  {
    id: "formal",
    label: "Formal",
    description: "Single column, centered serif header.",
    defaultColor: "#02061b",
    orderedSections: ALL_SECTIONS,
    atsSafe: true,
    render: (props) => <FormalTemplate {...props} />,
    buildHtml: buildFormalResumeHtml,
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Timeline entries, details in a right-hand rail.",
    defaultColor: "#02061b",
    orderedSections: MAIN_COLUMN_SECTIONS,
    atsSafe: true,
    render: (props) => <TimelineTemplate {...props} />,
    buildHtml: buildTimelineResumeHtml,
  },
  {
    id: "ledger",
    label: "Ledger",
    description: "Section titles in a left gutter, content beside them.",
    defaultColor: "#7c2d3a",
    orderedSections: ALL_SECTIONS,
    atsSafe: true,
    render: (props) => <LedgerTemplate {...props} />,
    buildHtml: buildLedgerResumeHtml,
  },
  {
    id: "banner",
    label: "Banner",
    description: "Single column under a full-width colour band.",
    defaultColor: DEFAULT_BANNER_COLOR,
    orderedSections: ALL_SECTIONS,
    atsSafe: true,
    render: (props) => <BannerTemplate {...props} />,
    buildHtml: buildBannerResumeHtml,
  },
  {
    id: "compact",
    label: "Compact",
    description: "Dense single column, headings on ruled lines.",
    defaultColor: "#2e404a",
    orderedSections: ALL_SECTIONS,
    atsSafe: true,
    render: (props) => <CompactTemplate {...props} />,
    buildHtml: buildCompactResumeHtml,
  },
  {
    id: "dated",
    label: "Dated",
    description: "Dates in a left margin, entries beside them.",
    defaultColor: "#5b4636",
    orderedSections: ALL_SECTIONS,
    atsSafe: true,
    render: (props) => <DatedTemplate {...props} />,
    buildHtml: buildDatedResumeHtml,
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export const getTemplate = (id: string): TemplateDefinition =>
  TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
