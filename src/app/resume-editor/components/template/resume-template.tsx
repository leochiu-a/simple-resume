"use client";

import { Page, View, Document } from "@react-pdf/renderer";

import { styles } from "./styles";
import Profile from "./profile";
import EmploymentHistory from "./employment-history";
import Education from "./education";
import Info from "./info";
import { A4_HEIGHT_PT } from "./constants";
import { Resume } from "@/types/resume";

const ResumeTemplate = ({ resume }: { resume: Resume }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ ...styles.flexRow, position: "relative" }}>
          <View
            style={{
              ...styles.info,
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
            />
          </View>
          <View
            style={{
              ...styles.flexCol,
              position: "relative",
              margin: "40pt 42px 0 220pt",
            }}
          >
            <Profile profile={resume.profile} />
            <EmploymentHistory employmentHistory={resume.employmentHistory} />
            <Education educations={resume.educations} />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ResumeTemplate;
