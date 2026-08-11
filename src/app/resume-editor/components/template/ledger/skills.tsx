import { View, Text } from "@react-pdf/renderer";

import { Skill } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * Two columns of disc bullets inside the content column. @react-pdf has no
 * support for CSS grid, so the row wraps instead and every item claims half its
 * width.
 */
const Skills = ({ skills, titleColor }: { skills: Skill[]; titleColor: string }) => {
  return (
    <Section title="Skills" titleColor={titleColor}>
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
