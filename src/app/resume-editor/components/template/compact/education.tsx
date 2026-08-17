import { View, Text } from "@react-pdf/renderer";

import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * One line per school: the school in bold, then the degree and major after it,
 * with the dates against the right margin. Whichever of the degree and the major
 * is missing takes its separator with it, so an entry never trails a bare pipe.
 */
const Education = ({ educations, accent }: { educations: EducationType[]; accent: string }) => {
  return (
    <Section title="Education" accent={accent}>
      <View style={styles.entryList}>
        {educations.map(({ school, degree, major, timeline }, index) => {
          const qualification = [degree, major].filter((part) => part.trim() !== "").join(", ");

          return (
            <AvoidBreak style={styles.entry} key={index}>
              <View style={styles.entryTopRow}>
                <Text style={styles.entryHeadline}>
                  <Text style={styles.entryHeadlineStrong}>{school}</Text>
                  {qualification && ` — ${qualification}`}
                </Text>

                <Text style={styles.entryDate}>{formatDateRange(timeline, "In school")}</Text>
              </View>
            </AvoidBreak>
          );
        })}
      </View>
    </Section>
  );
};

export default Education;
