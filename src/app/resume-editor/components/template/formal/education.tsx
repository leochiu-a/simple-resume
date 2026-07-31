import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * School and degree headline each entry; the major and the dates sit beneath at
 * a regular weight. A degree with no major named drops that half of the subline
 * rather than leaving a dangling separator.
 */
const Education = ({ educations }: { educations: EducationType[] }) => {
  return (
    <Section title="Education">
      <View style={styles.entryList}>
        {educations.map(({ school, degree, major, timeline }, index) => (
          <AvoidBreak style={styles.entry} key={index}>
            <Text style={styles.entryHeadline}>{`${school} | ${degree}`}</Text>

            <Text style={styles.entrySubline}>
              {major && `${major} | `}
              {formatDateRange(timeline, "In school")}
            </Text>
          </AvoidBreak>
        ))}
      </View>
    </Section>
  );
};

export default Education;
