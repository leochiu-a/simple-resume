"use client";

import { Page, View, Document } from "@react-pdf/renderer";

import { styles } from "./styles";
import Profile from "./profile";
import EmploymentHistory from "./employment-history";
import Education from "./education";
import Info from "./info";
import { A4_HEIGHT_PT } from "./constants";
import { Resume } from "@/types/resume";

const ResumeTemplate = ({
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
              margin: "40pt 42px 0 220pt",
            }}
          >
            {resume.visibility.profile && <Profile profile={resume.profile} />}
            {resume.visibility.employmentHistory && (
              <EmploymentHistory employmentHistory={resume.employmentHistory} />
            )}
            {resume.visibility.educations && (
              <Education educations={resume.educations} />
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ResumeTemplate;
