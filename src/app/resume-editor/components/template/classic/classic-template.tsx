"use client";

import { Page, View, Document } from "@react-pdf/renderer";

import { PAGE_PADDING_Y, styles } from "./styles";
import Profile from "./profile";
import EmploymentHistory from "./employment-history";
import Projects from "./projects";
import Education from "./education";
import Info from "./info";
import { A4_HEIGHT_PT } from "../constants";
import { Resume } from "@/types/resume";

const ClassicTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
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
            {resume.visibility.profile && <Profile profile={resume.profile} />}
            {resume.visibility.employmentHistory && (
              <EmploymentHistory employmentHistory={resume.employmentHistory} />
            )}
            {resume.visibility.projects && <Projects projects={resume.projects ?? []} />}
            {resume.visibility.educations && <Education educations={resume.educations} />}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ClassicTemplate;
