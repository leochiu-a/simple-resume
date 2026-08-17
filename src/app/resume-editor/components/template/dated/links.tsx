import { View, Text, Link } from "@react-pdf/renderer";

import { SocialLink } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * The links as their own bulleted section across the full measure, for the same
 * reason the skills are: a profile has no date to hang in the margin.
 */
const Links = ({ socialLinks, accent }: { socialLinks: SocialLink[]; accent: string }) => {
  return (
    <Section title="Links" accent={accent}>
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
