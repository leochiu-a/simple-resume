"use client";

import { Fragment } from "react";
import { Page, View, Text, Document } from "@react-pdf/renderer";

import { isCustomSectionId, Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";
import {
  MAIN_COLUMN_SECTIONS,
  MainColumnSection,
  customSectionById,
  sectionsToRender,
} from "@/lib/resume-sections";

import { styles } from "./styles";
import Section from "./section";
import Experience from "./experience";
import Projects from "./projects";
import Education from "./education";
import Rail from "./rail";
import Summary from "../summary";
import CustomSectionBlock from "./custom-section";

/**
 * The Timeline template: a banded header across the full width, then a wide main
 * column of dated timeline entries beside a narrow rail of contacts, skills and
 * links, closed by a heavy rule at the foot of the sheet.
 *
 * The picked colour is used as an accent rather than a fill — it tints the name
 * and the job titles, leaving the rules and body text in ink.
 *
 * Only the main column is the user's to arrange; the rail's contacts, skills and
 * links are part of the design and stay where they are.
 */
const TimelineTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const sections: Record<MainColumnSection, React.ReactNode> = {
    profile: (
      <Section title="Summary">
        <Summary profile={resume.profile} style={styles.summary} />
      </Section>
    ),
    employmentHistory: (
      <Experience employmentHistory={resume.employmentHistory} accent={backgroundColor} />
    ),
    projects: <Projects projects={filledProjects(resume.projects)} accent={backgroundColor} />,
    educations: <Education educations={resume.educations} />,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ ...styles.name, color: backgroundColor }}>{resume.name}</Text>
          <Text style={styles.jobTitle}>{resume.wantedJob}</Text>
        </View>

        <View style={styles.columns}>
          <View style={styles.main}>
            {sectionsToRender(resume, MAIN_COLUMN_SECTIONS).map((id) => (
              <Fragment key={id}>
                {isCustomSectionId(id) ? (
                  <CustomSectionBlock section={customSectionById(resume, id)} />
                ) : (
                  sections[id]
                )}
              </Fragment>
            ))}
          </View>

          <Rail resume={resume} />
        </View>

        <View style={styles.footer} />
      </Page>
    </Document>
  );
};

export default TimelineTemplate;
