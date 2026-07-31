import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import Marker from "./marker";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/** Schooling gets the same dated-marker treatment as the roles above it. */
const Education = ({ educations }: { educations: EducationType[] }) => {
  return (
    <Section title="Education">
      <View style={styles.entryList}>
        {educations.map(({ school, degree, major, timeline }, index) => (
          <AvoidBreak style={styles.entry} key={index}>
            <View style={styles.entryLeft}>
              <Marker connected={index < educations.length - 1} />
              <View style={styles.entryDateColumn}>
                <Text style={styles.entryDate}>{formatDateRange(timeline, "In school")}</Text>
              </View>
            </View>

            <View style={styles.educationRight}>
              <Text style={styles.entrySchool}>{school}</Text>
              <Text style={styles.entryDegree}>
                {degree}
                {major && `, ${major}`}
              </Text>
            </View>
          </AvoidBreak>
        ))}
      </View>
    </Section>
  );
};

export default Education;
