import { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import ResumeTemplate from "./resume-template";
import buildResumeHtml from "./build-resume-html";
import ModernTemplate from "./modern/modern-template";
import buildModernResumeHtml from "./modern/build-modern-resume-html";
import { DEFAULT_PANEL_COLOR } from "./modern/panel-color";

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
    render: (props) => <ResumeTemplate {...props} />,
    buildHtml: buildResumeHtml,
  },
  {
    id: "modern",
    label: "Modern",
    description: "Two columns, uppercase headings under hairline rules.",
    defaultColor: DEFAULT_PANEL_COLOR,
    render: (props) => <ModernTemplate {...props} />,
    buildHtml: buildModernResumeHtml,
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export const getTemplate = (id: string): TemplateDefinition =>
  TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
