"use client";

import { Page, View, Text, Document } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import { styles, CONTENT_COLOR } from "./styles";
import panelColors from "./panel-color";
import Sidebar from "./sidebar";
import Experience from "./experience";
import Education from "./education";
import Section from "./section";

/**
 * The Modern template: a tinted sidebar for identity, contact details, links and
 * skills, next to a wider column for the summary, experience and education.
 */
const ModernTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const panel = panelColors(backgroundColor);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Sidebar resume={resume} panel={panel} />

        <View style={styles.content}>
          {resume.visibility.profile && (
            <Section title="Summary" color={CONTENT_COLOR}>
              <Text style={styles.summary}>{resume.profile}</Text>
            </Section>
          )}

          {resume.visibility.employmentHistory && (
            <Experience employmentHistory={resume.employmentHistory} />
          )}

          {resume.visibility.educations && <Education educations={resume.educations} />}
        </View>
      </Page>
    </Document>
  );
};

export default ModernTemplate;
