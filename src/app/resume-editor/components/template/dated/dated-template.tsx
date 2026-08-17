"use client";

import { Fragment } from "react";
import { Page, View, Document } from "@react-pdf/renderer";

import { Resume, SectionId } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";
import { ALL_SECTIONS, sectionsToRender } from "@/lib/resume-sections";

import { styles } from "./styles";
import Header from "./header";
import Section from "./section";
import Experience from "./experience";
import Projects from "./projects";
import Education from "./education";
import Skills from "./skills";
import Links from "./links";
import Summary from "../summary";

/**
 * The Dated template: every job and every degree hangs its years in a narrow left
 * margin, with the entry itself in the column beside it.
 *
 * It is the shape an academic CV has always had, and it is the one arrangement
 * that lets a reader take in a career's chronology without reading it — the dates
 * line up down a single edge, so the gaps and the tenures are visible as
 * geometry.
 *
 * The gutter only has something in it where there are dates. Summary, Projects,
 * Skills and Links keep the column and leave it empty, so the whole sheet has one
 * content edge; see `section.tsx` for why.
 *
 * Every section is in the flow, so all six are the user's to arrange.
 */
const DatedTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const sections: Record<SectionId, React.ReactNode> = {
    profile: (
      <Section title="Summary" accent={backgroundColor} inset>
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
            <Fragment key={id}>{sections[id]}</Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default DatedTemplate;
