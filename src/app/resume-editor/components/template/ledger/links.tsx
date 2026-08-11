import { View, Text, Link } from "@react-pdf/renderer";

import { SocialLink } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * The links as a bulleted list in the content column, in the same style the other
 * templates give them.
 */
const Links = ({ socialLinks, titleColor }: { socialLinks: SocialLink[]; titleColor: string }) => {
  return (
    <Section title="Links" titleColor={titleColor}>
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
