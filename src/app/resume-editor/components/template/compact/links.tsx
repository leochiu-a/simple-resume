import { View, Text, Link } from "@react-pdf/renderer";
import { Fragment } from "react";

import { SocialLink } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * The links on one wrapping line, for the same reason the skills are: three
 * profiles do not need three rows.
 *
 * Built as a row of `Text` siblings rather than as one `Text` with the links
 * inside it, which is what it was first and which only worked in the PDF. A
 * `Link` needs `display: "flex"` to be visible at all in the preview — the
 * browser's own stylesheet hides `<link>` — and inside a run that turns each one
 * into a block, so the three profiles stacked and the middots between them fell
 * onto lines of their own.
 *
 * A row of flex items sits on one line and wraps as a whole, which is the same
 * arrangement `header.tsx` uses for the contact details and works in both
 * renderers. Each profile stays its own `Link`, so each is separately clickable
 * in the PDF and the middots are not.
 */
const Links = ({ socialLinks, accent }: { socialLinks: SocialLink[]; accent: string }) => {
  return (
    <Section title="Links" accent={accent}>
      <View style={styles.inlineRow}>
        {socialLinks.map(({ name, url }, index) => (
          <Fragment key={index}>
            {index > 0 && <Text style={styles.inlineSeparator}>·</Text>}
            {/* The label has to sit inside a Text: the preview renders this tree
                as DOM, where a bare <LINK> is treated as a void element and
                drops its children. */}
            <Text>
              <Link src={url} style={styles.link}>
                {name}
              </Link>
            </Text>
          </Fragment>
        ))}
      </View>
    </Section>
  );
};

export default Links;
