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
 * The Ledger template: every section is a row with its title in a narrow left
 * gutter and its content in the wide column beside it.
 *
 * There is no tinted panel to carry the picked colour, so it goes on the rule
 * under the header and on the section titles running down the gutter — the two
 * things that describe the layout — and the rest of the sheet stays in ink.
 *
 * Every row is in the one flow, so all six sections are the user's to arrange.
 */
const LedgerTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const sections: Record<SectionId, React.ReactNode> = {
    profile: (
      <Section title="Summary" titleColor={backgroundColor}>
        <Summary profile={resume.profile} style={styles.summary} />
      </Section>
    ),
    employmentHistory: (
      <Experience employmentHistory={resume.employmentHistory} titleColor={backgroundColor} />
    ),
    projects: <Projects projects={filledProjects(resume.projects)} titleColor={backgroundColor} />,
    educations: <Education educations={resume.educations} titleColor={backgroundColor} />,
    skills: <Skills skills={resume.skills} titleColor={backgroundColor} />,
    socialLinks: <Links socialLinks={resume.socialLinks} titleColor={backgroundColor} />,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header resume={resume} accentColor={backgroundColor} />

        <View style={styles.body}>
          {sectionsToRender(resume, ALL_SECTIONS).map((id) => (
            <Fragment key={id}>
              {isCustomSectionId(id) ? (
                <CustomSectionBlock
                  section={customSectionById(resume, id)}
                  titleColor={backgroundColor}
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

export default LedgerTemplate;
