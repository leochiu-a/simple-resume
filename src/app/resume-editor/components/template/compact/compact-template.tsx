"use client";

import { Fragment } from "react";
import { Page, View, Document } from "@react-pdf/renderer";

import { isCustomSectionId, Resume, SectionId } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";
import { ALL_SECTIONS, customSectionById, sectionsToRender } from "@/lib/resume-sections";

import { styles } from "./styles";
import Header from "./header";
import Section from "./section";
import Experience from "./experience";
import Projects from "./projects";
import Education from "./education";
import Skills from "./skills";
import Links from "./links";
import Summary from "../summary";
import CustomSectionBlock from "./custom-section";

/**
 * The Compact template: one dense column, no panel, no gutter, no colour block.
 *
 * It is the one to reach for when the constraint is the page rather than the
 * impression — ten years that have to fit on one sheet, or an application read by
 * a parser before a person. A single top-to-bottom column with plain headings is
 * the shape those read most reliably; a sidebar is the layout they most often get
 * wrong, and three of the other templates have one.
 *
 * One column means every section is in the flow, so all six are the user's to
 * arrange.
 */
const CompactTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const sections: Record<SectionId, React.ReactNode> = {
    profile: (
      <Section title="Summary" accent={backgroundColor}>
        <Summary profile={resume.profile} style={styles.summary} />
      </Section>
    ),
    employmentHistory: (
      <Experience employmentHistory={resume.employmentHistory} accent={backgroundColor} />
    ),
    projects: <Projects projects={filledProjects(resume.projects)} accent={backgroundColor} />,
    educations: <Education educations={resume.educations} accent={backgroundColor} />,
    skills: <Skills skills={resume.skills} accent={backgroundColor} />,
    socialLinks: <Links socialLinks={resume.socialLinks} accent={backgroundColor} />,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header resume={resume} />

        <View style={styles.body}>
          {/* Only the visible ones come back, so the map needs no guard of its own. */}
          {sectionsToRender(resume, ALL_SECTIONS).map((id) => (
            <Fragment key={id}>
              {isCustomSectionId(id) ? (
                <CustomSectionBlock
                  section={customSectionById(resume, id)}
                  accent={backgroundColor}
                />
              ) : (
                sections[id]
              )}
            </Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default CompactTemplate;
