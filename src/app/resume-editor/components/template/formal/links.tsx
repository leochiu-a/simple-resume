import { View, Text, Link } from "@react-pdf/renderer";

import { SocialLink } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * The reference design has no links, but the resume model carries them and both
 * other templates show them, so they get a section of their own in the same
 * bulleted style.
 */
const Links = ({ socialLinks }: { socialLinks: SocialLink[] }) => {
  return (
    <Section title="Links">
      <View style={styles.bulletList}>
        {socialLinks.map(({ name, url }, index) => (
          <View style={styles.bulletRow} key={index}>
            <Text style={styles.bullet}>•</Text>
            {/* The label has to sit inside a Text: the preview renders this tree
                as DOM, where a bare <LINK> is treated as a void element and
                drops its children. */}
            <Text style={styles.bulletText}>
              <Link src={url} style={styles.link}>
                {name}
              </Link>
            </Text>
          </View>
        ))}
      </View>
    </Section>
  );
};

export default Links;
