"use client";

import { Page, View, Text, Document } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import { styles } from "./styles";
import Header from "./header";
import Section from "./section";
import Experience from "./experience";
import Education from "./education";
import Skills from "./skills";
import Links from "./links";

/**
 * The Formal template: one column under a centred serif header, with the wanted
 * job announced above the name and the contact details on a single row.
 *
 * There is no tinted panel to carry the picked colour, so it tints the name and
 * the rest of the sheet stays in ink.
 */
const FormalTemplate = ({
  resume,
  backgroundColor,
}: {
  resume: Resume;
  backgroundColor: string;
}) => {
  const { visibility } = resume;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header resume={resume} nameColor={backgroundColor} />

        <View style={styles.body}>
          {visibility.profile && (
            <Section title="Summary">
              <Text style={styles.summary}>{resume.profile}</Text>
            </Section>
          )}

          {visibility.employmentHistory && (
            <Experience employmentHistory={resume.employmentHistory} />
          )}

          {visibility.educations && <Education educations={resume.educations} />}

          {visibility.skills && <Skills skills={resume.skills} />}

          {visibility.socialLinks && <Links socialLinks={resume.socialLinks} />}
        </View>
      </Page>
    </Document>
  );
};

export default FormalTemplate;
