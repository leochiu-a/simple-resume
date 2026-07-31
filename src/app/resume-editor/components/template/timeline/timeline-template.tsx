"use client";

import { Page, View, Text, Document } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import { styles } from "./styles";
import Section from "./section";
import Experience from "./experience";
import Education from "./education";
import Rail from "./rail";

/**
 * The Timeline template: a banded header across the full width, then a wide main
 * column of dated timeline entries beside a narrow rail of contacts, skills and
 * links, closed by a heavy rule at the foot of the sheet.
 *
 * The picked colour is used as an accent rather than a fill — it tints the name
 * and the job titles, leaving the rules and body text in ink.
 */
const TimelineTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ ...styles.name, color: backgroundColor }}>{resume.name}</Text>
          <Text style={styles.jobTitle}>{resume.wantedJob}</Text>
        </View>

        <View style={styles.columns}>
          <View style={styles.main}>
            {resume.visibility.profile && (
              <Section title="Summary">
                <Text style={styles.summary}>{resume.profile}</Text>
              </Section>
            )}

            {resume.visibility.employmentHistory && (
              <Experience employmentHistory={resume.employmentHistory} accent={backgroundColor} />
            )}

            {resume.visibility.educations && <Education educations={resume.educations} />}
          </View>

          <Rail resume={resume} />
        </View>

        <View style={styles.footer} />
      </Page>
    </Document>
  );
};

export default TimelineTemplate;
