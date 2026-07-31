import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { styles } from "./styles";

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
          <View style={styles.entry} key={index} wrap={false}>
            <Text style={styles.entryHeadline}>{`${school} | ${degree}`}</Text>

            <Text style={styles.entrySubline}>
              {major && `${major} | `}
              {formatDateRange(timeline, "In school")}
            </Text>
          </View>
        ))}
      </View>
    </Section>
  );
};

export default Education;
