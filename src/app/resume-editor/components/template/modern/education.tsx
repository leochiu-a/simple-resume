import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { styles, CONTENT_COLOR } from "./styles";
import AvoidBreak from "../avoid-break";

const Education = ({ educations }: { educations: EducationType[] }) => {
  return (
    <Section title="Education" color={CONTENT_COLOR}>
      <View style={styles.entryList}>
        {educations.map(({ school, degree, major, timeline }, index) => (
          <AvoidBreak style={styles.entry} key={index}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>{formatDateRange(timeline, "In school")}</Text>
              <Text style={styles.entryTitle}>
                {degree}
                {major && ` of ${major}`}
              </Text>
              <Text style={styles.entryLocation}>{school}</Text>
            </View>
          </AvoidBreak>
        ))}
      </View>
    </Section>
  );
};

export default Education;
