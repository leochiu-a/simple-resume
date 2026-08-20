import { View } from "@react-pdf/renderer";

import { CustomSection } from "@/types/resume";

import Section from "./section";
import { bulletStyles, CONTENT_COLOR, styles } from "./styles";
import CustomLines from "../custom-lines";

/**
 * A section the user named — the heading they gave it, then its lines drawn as
 * this template's own bullets.
 *
 * Untitled renders nothing at all: a block of text under no heading says less
 * than nothing on a resume. A new section arrives with a default name, so this is
 * the case where the name was cleared; it comes back the moment there is one.
 */
const CustomSectionBlock = ({ section }: { section: CustomSection | undefined }) => {
  /* Undefined when the order names a section that has since been deleted — the
     next read drops the id, and until then there is nothing to draw. */
  if (!section?.title.trim()) return null;

  return (
    <Section title={section.title} color={CONTENT_COLOR}>
      <View style={styles.description}>
        <CustomLines
          description={section.description}
          rowStyle={styles.descriptionRow}
          styles={bulletStyles}
        />
      </View>
    </Section>
  );
};

export default CustomSectionBlock;
