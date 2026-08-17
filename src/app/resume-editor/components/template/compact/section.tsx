import { View, Text } from "@react-pdf/renderer";
import { PropsWithChildren } from "react";

import { styles } from "./styles";

/**
 * A small letter-spaced title with the rule running from the end of it out to the
 * right margin, both in the picked colour.
 *
 * The rule shares the title's line rather than sitting under it, which is what
 * separates this from Modern's heading-over-a-hairline — and it is a line saved
 * per section, which on a template whose whole job is fitting more on one page is
 * the reason rather than the flourish.
 */
const Section = ({
  title,
  accent,
  children,
}: PropsWithChildren<{ title: string; accent: string }>) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={{ ...styles.sectionTitle, color: accent }}>{title}</Text>
        <View style={{ ...styles.sectionRule, backgroundColor: accent }} />
      </View>

      {children}
    </View>
  );
};

export default Section;
