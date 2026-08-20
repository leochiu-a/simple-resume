"use client";

import { Fragment } from "react";
import { Page, View, Document } from "@react-pdf/renderer";

import { isCustomSectionId, Resume, SectionId } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";
import { ALL_SECTIONS, customSectionById, sectionsToRender } from "@/lib/resume-sections";

import { styles } from "./styles";
import bannerColors from "./banner-color";
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
 * The Banner template: a full-bleed colour band across the top of the sheet
 * carrying the name and contact details, then one column of sections beneath.
 *
 * It is the only template that puts the picked colour at the paper's edge. Every
 * other one tints a sidebar, a gutter or a word, so the band is what tells this
 * one apart at thumbnail size — where the words are illegible and the shape of
 * the page is the whole of the choice being made.
 *
 * One column means every section is in the flow, so all six are the user's to
 * arrange.
 */
const BannerTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const colors = bannerColors(backgroundColor);

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
        <Header resume={resume} colors={colors} />

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

export default BannerTemplate;
