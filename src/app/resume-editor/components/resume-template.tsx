"use client";

import { Page, View, Document } from "@react-pdf/renderer";

import { styles } from "./styles";
import Profile from "./profile";
import EmploymentHistory from "./employment-history";
import Education from "./education";
import Info from "./info";

const ResumeTemplate = () => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ ...styles.flexRow, position: "relative" }}>
          <View style={{ ...styles.info, position: "absolute" }}>
            <Info />
          </View>
          <View
            style={{
              position: "relative",
              ...styles.flexCol,
              padding: "40pt",
              marginLeft: "210px",
            }}
          >
            <Profile />
            <EmploymentHistory />
            <Education />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ResumeTemplate;
