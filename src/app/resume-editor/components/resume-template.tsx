"use client";

import { Page, View, Document } from "@react-pdf/renderer";

import { styles } from "./styles";
import Profile from "./profile";
import EmploymentHistory from "./employment-history";
import Education from "./education";

const ResumeTemplate = () => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ margin: 40, ...styles.flexCol }}>
          <Profile />
          <EmploymentHistory />
          <Education />
        </View>
      </Page>
    </Document>
  );
};

export default ResumeTemplate;
