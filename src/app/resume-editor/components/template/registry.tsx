import { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import ClassicTemplate from "./classic/classic-template";
import buildClassicResumeHtml from "./classic/build-classic-resume-html";
import ModernTemplate from "./modern/modern-template";
import buildModernResumeHtml from "./modern/build-modern-resume-html";
import { DEFAULT_PANEL_COLOR } from "./modern/panel-color";
import FormalTemplate from "./formal/formal-template";
import buildFormalResumeHtml from "./formal/build-formal-resume-html";
import TimelineTemplate from "./timeline/timeline-template";
import buildTimelineResumeHtml from "./timeline/build-timeline-resume-html";

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
  render: (props: TemplateProps) => ReactElement<DocumentProps>;
  buildHtml: (props: TemplateProps) => string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Serif headings on a full-height colour sidebar.",
    defaultColor: "#094C42",
    render: (props) => <ClassicTemplate {...props} />,
    buildHtml: buildClassicResumeHtml,
  },
  {
    id: "modern",
    label: "Modern",
    description: "Two columns, uppercase headings under hairline rules.",
    defaultColor: DEFAULT_PANEL_COLOR,
    render: (props) => <ModernTemplate {...props} />,
    buildHtml: buildModernResumeHtml,
  },
  {
    id: "formal",
    label: "Formal",
    description: "Single column, centered serif header.",
    defaultColor: "#02061b",
    render: (props) => <FormalTemplate {...props} />,
    buildHtml: buildFormalResumeHtml,
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "Timeline entries, details in a right-hand rail.",
    defaultColor: "#02061b",
    render: (props) => <TimelineTemplate {...props} />,
    buildHtml: buildTimelineResumeHtml,
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export const getTemplate = (id: string): TemplateDefinition =>
  TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
