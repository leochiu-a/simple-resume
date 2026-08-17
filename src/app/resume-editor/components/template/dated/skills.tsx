import { View, Text } from "@react-pdf/renderer";

import { Skill } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * Two columns of disc bullets across the full measure — no date margin, since a
 * skill has no date. @react-pdf has no CSS grid, so the row wraps and every item
 * claims half its width.
 */
const Skills = ({ skills, accent }: { skills: Skill[]; accent: string }) => {
  return (
    <Section title="Skills" accent={accent}>
      <View style={styles.skillList}>
        {skills.map(({ name }, index) => (
          <View style={styles.skillItem} key={index}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{name}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
};

export default Skills;
