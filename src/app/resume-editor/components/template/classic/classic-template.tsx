"use client";

import { Fragment } from "react";
import { Page, View, Document } from "@react-pdf/renderer";

import { PAGE_PADDING_Y, styles } from "./styles";
import Profile from "./profile";
import EmploymentHistory from "./employment-history";
import Projects from "./projects";
import Education from "./education";
import Info from "./info";
import { A4_HEIGHT_PT } from "../constants";
import { isCustomSectionId, Resume } from "@/types/resume";
import { filledProjects } from "@/lib/resume-projects";
import {
  MAIN_COLUMN_SECTIONS,
  MainColumnSection,
  customSectionById,
  sectionsToRender,
} from "@/lib/resume-sections";
import CustomSectionBlock from "./custom-section";

/**
 * The Classic template: a full-height tinted panel of identity, contacts, links
 * and skills, with the dated sections in the column beside it.
 *
 * Only that column is the user's to arrange — the panel's contents are the design.
 */
const ClassicTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const sections: Record<MainColumnSection, React.ReactNode> = {
    profile: <Profile profile={resume.profile} />,
    employmentHistory: <EmploymentHistory employmentHistory={resume.employmentHistory} />,
    projects: <Projects projects={filledProjects(resume.projects)} />,
    educations: <Education educations={resume.educations} />,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ ...styles.flexRow, position: "relative" }}>
          <View
            style={{
              ...styles.info,
              backgroundColor,
              position: "absolute",
              // The page's vertical padding holds the text off the trim; the
              // panel is meant to reach it, so it is pulled back out over that
              // padding at both ends. Both ends, not just the top: anchored by
              // its top alone it ends one padding short of the sheet, which on a
              // second page is a band of white under a panel that should have run
              // to the bottom.
              top: `-${PAGE_PADDING_Y}`,
              bottom: `-${PAGE_PADDING_Y}`,
              // The floor for a resume that stops short of a full page, where
              // there is no column beside it to be stretched by.
              minHeight: `${A4_HEIGHT_PT}pt`,
            }}
          >
            <Info
              name={resume.name}
              jobTitle={resume.wantedJob}
              email={resume.email}
              phone={resume.phone}
              city={resume.city}
              links={resume.socialLinks}
              skills={resume.skills}
              visibility={resume.visibility}
            />
          </View>
          <View
            style={{
              ...styles.flexCol,
              position: "relative",
              margin: "0 42px 0 220pt",
            }}
          >
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
        </View>
      </Page>
    </Document>
  );
};

export default ClassicTemplate;
