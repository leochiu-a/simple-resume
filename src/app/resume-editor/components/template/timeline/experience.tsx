import { View, Text } from "@react-pdf/renderer";

import { EmploymentHistory } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import Marker from "./marker";
import { styles } from "./styles";

/**
 * Each role is two halves of equal width: the dated marker on the left, the role
 * itself on the right. The connector is dropped on the last entry so the line
 * ends on the final dot rather than trailing past it.
 */
const Experience = ({
  employmentHistory,
  accent,
}: {
  employmentHistory: EmploymentHistory[];
  accent: string;
}) => {
  return (
    <Section title="Experience">
      <View style={styles.entryList}>
        {employmentHistory.map(({ company, jobTitle, timeline, description }, index) => {
          const bullets = description.split(SPLIT_TEXT).filter((item) => item.trim() !== "");

          return (
            <View style={styles.entry} key={index} wrap={false}>
              <View style={styles.entryLeft}>
                <Marker connected={index < employmentHistory.length - 1} />
                <View style={styles.entryDateColumn}>
                  <Text style={styles.entryDate}>{formatDateRange(timeline, "Present")}</Text>
                </View>
              </View>

              <View style={styles.entryRight}>
                <Text style={{ ...styles.entryTitle, color: accent }}>{jobTitle}</Text>
                <Text style={styles.entryCompany}>{company}</Text>

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
            </View>
          );
        })}
      </View>
    </Section>
  );
};

export default Experience;
