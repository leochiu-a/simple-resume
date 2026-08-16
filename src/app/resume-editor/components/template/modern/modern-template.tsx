"use client";

import { Fragment } from "react";
import { Page, View, Document } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";
import { MAIN_COLUMN_SECTIONS, MainColumnSection, sectionsToRender } from "@/lib/resume-sections";

import { styles, CONTENT_COLOR } from "./styles";
import panelColors from "./panel-color";
import Sidebar from "./sidebar";
import Experience from "./experience";
import Projects from "./projects";
import Education from "./education";
import Section from "./section";
import Summary from "../summary";

/**
 * The Modern template: a tinted sidebar for identity, contact details, links and
 * skills, next to a wider column for the summary, experience and education.
 *
 * Only the main column is the user's to arrange. Skills and links belong to the
 * sidebar, where the order — links above skills — is part of the design rather
 * than a preference, so they are left out of the reorder list entirely.
 */
const ModernTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const panel = panelColors(backgroundColor);

  const sections: Record<MainColumnSection, React.ReactNode> = {
    profile: (
      <Section title="Summary" color={CONTENT_COLOR}>
        <Summary profile={resume.profile} style={styles.summary} />
      </Section>
    ),
    employmentHistory: <Experience employmentHistory={resume.employmentHistory} />,
    projects: <Projects projects={filledProjects(resume.projects)} />,
    educations: <Education educations={resume.educations} />,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Sidebar resume={resume} panel={panel} />

        <View style={styles.content}>
          {sectionsToRender(resume, MAIN_COLUMN_SECTIONS).map((id) => (
            <Fragment key={id}>{sections[id]}</Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ModernTemplate;
