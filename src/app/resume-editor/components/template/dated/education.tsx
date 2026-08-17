import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatMarginDateRange from "./format-date";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * The other dated section, so it takes the same two columns: the years in the
 * margin, the school and what was studied beside them.
 *
 * A degree with no major named drops that half of the subline rather than leaving
 * a dangling separator.
 */
const Education = ({ educations, accent }: { educations: EducationType[]; accent: string }) => {
  return (
    <Section title="Education" accent={accent}>
      <View style={styles.entryList}>
        {educations.map(({ school, degree, major, timeline }, index) => (
          <AvoidBreak style={styles.datedRow} key={index}>
            <Text style={styles.dateColumn}>{formatMarginDateRange(timeline, "In school")}</Text>

            <View style={styles.entryColumn}>
              <Text style={styles.entryHeadline}>{school}</Text>
              <Text style={styles.entrySubline}>
                {degree}
                {major && ` | ${major}`}
              </Text>
            </View>
          </AvoidBreak>
        ))}
      </View>
    </Section>
  );
};

export default Education;
