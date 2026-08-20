import { View } from "@react-pdf/renderer";

import { Skill } from "@/types/resume";

import Section from "./section";
import { bulletStyles, styles } from "./styles";
import { BulletMarks } from "../bullet-row";

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
            <BulletMarks line={name} styles={bulletStyles} />
          </View>
        ))}
      </View>
    </Section>
  );
};

export default Skills;
