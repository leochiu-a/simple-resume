import { View, Text, Link } from "@react-pdf/renderer";

import { Resume } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * The narrow right-hand column: contacts, then skills as pills, then links.
 *
 * The contacts deliberately carry no heading, as in the reference — they read as
 * the header's continuation rather than as a section of their own. The reference
 * prefixes each with a small icon; those are left out, since an icon would mean
 * `Svg`, which draws nothing in the preview.
 */
const Rail = ({ resume }: { resume: Resume }) => {
  const { visibility } = resume;

  return (
    <View style={styles.rail}>
      <View style={styles.contactList}>
        {[resume.email, resume.phone, resume.city].map((detail, index) => (
          <View style={styles.contactRow} key={index}>
            <Text style={styles.contactText}>{detail}</Text>
          </View>
        ))}
      </View>

      {visibility.skills && (
        <Section title="Skills">
          <View style={styles.pillRow}>
            {resume.skills.map(({ name }, index) => (
              <View style={styles.pill} key={index}>
                <Text style={styles.pillText}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {visibility.socialLinks && (
        <Section title="Links">
          <View style={styles.linkList}>
            {resume.socialLinks.map(({ name, url }, index) => (
              /* The label has to sit inside a Text: the preview renders this tree
                 as DOM, where a bare <LINK> is a void element and drops its
                 children. */
              <Text style={styles.linkRow} key={index}>
                <Link src={url} style={styles.link}>
                  {name}
                </Link>
              </Text>
            ))}
          </View>
        </Section>
      )}
    </View>
  );
};

export default Rail;
