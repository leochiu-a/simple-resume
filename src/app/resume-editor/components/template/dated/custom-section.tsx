import { CustomSection } from "@/types/resume";

import Section from "./section";
import { bulletStyles, styles } from "./styles";
import CustomLines from "../custom-lines";

/**
 * A section the user named — the heading they gave it, then its lines drawn as
 * this template's own bullets.
 *
 * Untitled renders nothing at all: a block of text under no heading says less
 * than nothing on a resume, and a heading is the one thing a section this open
 * cannot be given a default for. It appears the moment it is named.
 */
const CustomSectionBlock = ({
  section,
  accent,
}: {
  section: CustomSection | undefined;
  accent: string;
}) => {
  /* Undefined when the order names a section that has since been deleted — the
     next read drops the id, and until then there is nothing to draw. */
  if (!section?.title.trim()) return null;

  return (
    <Section title={section.title} accent={accent} inset>
      <CustomLines
        description={section.description}
        rowStyle={styles.entryBullet}
        styles={bulletStyles}
      />
    </Section>
  );
};

export default CustomSectionBlock;
