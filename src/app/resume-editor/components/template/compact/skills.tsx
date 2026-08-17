import { Text } from "@react-pdf/renderer";

import { Skill } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * Every skill on one wrapping line, separated by middots.
 *
 * The other templates give this two bulleted columns, which for six skills is
 * three lines of mostly white space. Run together they are one, and one is what a
 * parser reads most reliably — a delimited run under a "Skills" heading, with no
 * column order for it to reassemble in the wrong sequence.
 */
const Skills = ({ skills, accent }: { skills: Skill[]; accent: string }) => {
  return (
    <Section title="Skills" accent={accent}>
      <Text style={styles.inlineList}>{skills.map(({ name }) => name).join("  ·  ")}</Text>
    </Section>
  );
};

export default Skills;
