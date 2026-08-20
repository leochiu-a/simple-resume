import { View, Text } from "@react-pdf/renderer";

import { EmploymentHistory } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import Marker from "./marker";
import { bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks } from "../bullet-row";

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
          const bullets = toBulletLines(description);

          return (
            <AvoidBreak style={styles.entry} key={index}>
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
                        <BulletMarks line={item} styles={bulletStyles} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </AvoidBreak>
          );
        })}
      </View>
    </Section>
  );
};

export default Experience;
