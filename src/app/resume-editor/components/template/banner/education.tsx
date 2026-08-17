import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * The school headlines each entry with its dates against the right margin, the
 * same shape Experience uses, and the degree and major follow beneath. A degree
 * with no major named drops that half of the subline rather than leaving a
 * dangling separator.
 */
const Education = ({ educations }: { educations: EducationType[] }) => {
  return (
    <Section title="Education">
      <View style={styles.entryList}>
        {educations.map(({ school, degree, major, timeline }, index) => (
          <AvoidBreak style={styles.entry} key={index}>
            <View style={styles.entryTopRow}>
              <Text style={styles.entryHeadline}>{school}</Text>
              <Text style={styles.entryDate}>{formatDateRange(timeline, "In school")}</Text>
            </View>

            <Text style={styles.entrySubline}>
              {degree}
              {major && ` | ${major}`}
            </Text>
          </AvoidBreak>
        ))}
      </View>
    </Section>
  );
};

export default Education;
