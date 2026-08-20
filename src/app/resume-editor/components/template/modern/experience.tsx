import { View, Text } from "@react-pdf/renderer";

import { EmploymentHistory } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { CONTENT_COLOR, bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks } from "../bullet-row";

const Experience = ({ employmentHistory }: { employmentHistory: EmploymentHistory[] }) => {
  return (
    <Section title="Experience" color={CONTENT_COLOR}>
      <View style={styles.entryList}>
        {employmentHistory.map(({ company, jobTitle, timeline, description }, index) => {
          const bullets = toBulletLines(description);

          return (
            <AvoidBreak style={styles.entry} key={index}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{formatDateRange(timeline, "Present")}</Text>
                <Text style={styles.entryTitle}>{jobTitle}</Text>
                <Text style={styles.entryLocation}>{company}</Text>
              </View>

              {bullets.length > 0 && (
                <View style={styles.description}>
                  {bullets.map((item, itemIndex) => (
                    <View style={styles.descriptionRow} key={item + itemIndex}>
                      <BulletMarks line={item} styles={bulletStyles} />
                    </View>
                  ))}
                </View>
              )}
            </AvoidBreak>
          );
        })}
      </View>
    </Section>
  );
};

export default Experience;
