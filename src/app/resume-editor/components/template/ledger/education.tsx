import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * The school headlines each entry with its dates at the right margin, matching
 * how Experience sets a role out. The degree and major follow as a muted subline;
 * a degree with no major named drops that half rather than leaving a dangling
 * separator.
 */
const Education = ({
  educations,
  titleColor,
}: {
  educations: EducationType[];
  titleColor: string;
}) => {
  return (
    <Section title="Education" titleColor={titleColor}>
      <View style={styles.entryList}>
        {educations.map(({ school, degree, major, timeline }, index) => (
          <AvoidBreak style={styles.entry} key={index}>
            <View style={styles.entryHeadline}>
              <Text style={styles.entryTitle}>{school}</Text>
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
