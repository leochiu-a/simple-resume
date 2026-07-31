import { View, Text } from "@react-pdf/renderer";

import { EmploymentHistory } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles } from "./styles";

/**
 * Each role headlines with its uppercased job title and, at a regular weight
 * and left as typed, the dates it ran for. The company follows at body size,
 * then the description as disc bullets.
 */
const Experience = ({ employmentHistory }: { employmentHistory: EmploymentHistory[] }) => {
  return (
    <Section title="Experience">
      <View style={styles.entryList}>
        {employmentHistory.map(({ company, jobTitle, timeline, description }, index) => {
          const bullets = description.split(SPLIT_TEXT).filter((item) => item.trim() !== "");

          return (
            <View style={styles.entry} key={index} wrap={false}>
              <Text style={{ ...styles.entryHeadline, ...styles.entryHeadlineUpper }}>
                {jobTitle}
                <Text style={styles.entryHeadlineDate}>
                  {` | ${formatDateRange(timeline, "Present")}`}
                </Text>
              </Text>

              <Text style={styles.entrySubline}>{company}</Text>

              {bullets.length > 0 && (
                <View style={styles.description}>
                  {bullets.map((item, itemIndex) => (
                    <View style={styles.descriptionRow} key={item + itemIndex}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Section>
  );
};

export default Experience;
