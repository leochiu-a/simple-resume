"use client";

import { Page, View, Document } from "@react-pdf/renderer";

import { styles } from "./styles";
import Profile from "./profile";
import EmploymentHistory from "./employment-history";
import Education from "./education";
import Info from "./info";
import { A4_HEIGHT_PT } from "./constants";

const ResumeTemplate = () => {
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
            <Info />
          </View>
          <View
            style={{
              ...styles.flexCol,
              position: "relative",
              margin: "40pt 42px 0 220pt",
            }}
            debug
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
