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
 * The Formal template: one column under a centred serif header, with the wanted
 * job announced above the name and the contact details on a single row.
 *
 * There is no tinted panel to carry the picked colour, so it tints the name and
 * the rest of the sheet stays in ink.
 *
 * One column means every section is in the flow, so all six are the user's to
 * arrange.
 */
const FormalTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const sections: Record<SectionId, React.ReactNode> = {
    profile: (
      <Section title="Summary">
        <Summary profile={resume.profile} style={styles.summary} />
      </Section>
    ),
    employmentHistory: <Experience employmentHistory={resume.employmentHistory} />,
    projects: <Projects projects={filledProjects(resume.projects)} />,
    educations: <Education educations={resume.educations} />,
    skills: <Skills skills={resume.skills} />,
    socialLinks: <Links socialLinks={resume.socialLinks} />,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header resume={resume} nameColor={backgroundColor} />

        <View style={styles.body}>
          {/* Only the visible ones come back, so the map needs no guard of its own. */}
          {sectionsToRender(resume, ALL_SECTIONS).map((id) => (
            <Fragment key={id}>
              {isCustomSectionId(id) ? (
                <CustomSectionBlock section={customSectionById(resume, id)} />
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

export default FormalTemplate;
