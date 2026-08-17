import { Text, Link } from "@react-pdf/renderer";
import { Fragment } from "react";

import { SocialLink } from "@/types/resume";

import Section from "./section";
import { styles } from "./styles";

/**
 * The links on one wrapping line too, for the same reason the skills are: three
 * profiles do not need three rows.
 *
 * Each stays its own `Link` rather than the line being one, so every profile is
 * separately clickable in the PDF — and the middots between them are not.
 */
const Links = ({ socialLinks, accent }: { socialLinks: SocialLink[]; accent: string }) => {
  return (
    <Section title="Links" accent={accent}>
      {/* The labels have to sit inside a Text: the preview renders this tree as
          DOM, where a bare <LINK> is treated as a void element and drops its
          children. */}
      <Text style={styles.inlineList}>
        {socialLinks.map(({ name, url }, index) => (
          <Fragment key={index}>
            {index > 0 && "  ·  "}
            <Link src={url} style={styles.link}>
              {name}
            </Link>
          </Fragment>
        ))}
      </Text>
    </Section>
  );
};

export default Links;
