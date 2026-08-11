"use client";

import { Page, View, Document } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import { styles } from "./styles";
import Header from "./header";
import Section from "./section";
import Experience from "./experience";
import Projects from "./projects";
import Education from "./education";
import Skills from "./skills";
import Links from "./links";
import Summary from "../summary";

/**
 * The Ledger template: every section is a row with its title in a narrow left
 * gutter and its content in the wide column beside it.
 *
 * There is no tinted panel to carry the picked colour, so it goes on the rule
 * under the header and on the section titles running down the gutter — the two
 * things that describe the layout — and the rest of the sheet stays in ink.
 */
const LedgerTemplate = ({
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
        <Header resume={resume} accentColor={backgroundColor} />

        <View style={styles.body}>
          {visibility.profile && (
            <Section title="Summary" titleColor={backgroundColor}>
              <Summary profile={resume.profile} style={styles.summary} />
            </Section>
          )}

          {visibility.employmentHistory && (
            <Experience employmentHistory={resume.employmentHistory} titleColor={backgroundColor} />
          )}

          {visibility.projects && (
            <Projects projects={resume.projects ?? []} titleColor={backgroundColor} />
          )}

          {visibility.educations && (
            <Education educations={resume.educations} titleColor={backgroundColor} />
          )}

          {visibility.skills && <Skills skills={resume.skills} titleColor={backgroundColor} />}

          {visibility.socialLinks && (
            <Links socialLinks={resume.socialLinks} titleColor={backgroundColor} />
          )}
        </View>
      </Page>
    </Document>
  );
};

export default LedgerTemplate;
