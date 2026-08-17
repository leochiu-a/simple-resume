import { View, Text, Link } from "@react-pdf/renderer";

import { SocialLink } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * The links as their own bulleted section, matching the other single-column
 * templates. The band above carries the city, email and phone; anything with a
 * url belongs down here where it can be clicked.
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
