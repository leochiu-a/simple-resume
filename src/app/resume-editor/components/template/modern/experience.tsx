import { View, Text } from "@react-pdf/renderer";

import { EmploymentHistory } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles, CONTENT_COLOR } from "./styles";
import AvoidBreak from "../avoid-break";

const Experience = ({ employmentHistory }: { employmentHistory: EmploymentHistory[] }) => {
  return (
    <Section title="Experience" color={CONTENT_COLOR}>
      <View style={styles.entryList}>
        {employmentHistory.map(({ company, jobTitle, timeline, description }, index) => {
          const bullets = description.split(SPLIT_TEXT).filter((item) => item.trim() !== "");

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
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
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
