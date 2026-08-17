import { View, Text } from "@react-pdf/renderer";

import { Skill } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * Two columns of disc bullets. The reference lays these out with
 * `grid-template-columns: 1fr 1fr`, which @react-pdf has no support for, so the
 * row wraps instead and every item claims half its width.
 */
const Skills = ({ skills }: { skills: Skill[] }) => {
  return (
    <Section title="Skills">
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
