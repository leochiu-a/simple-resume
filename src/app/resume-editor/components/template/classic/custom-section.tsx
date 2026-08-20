import { View } from "@react-pdf/renderer";

import { CustomSection } from "@/types/resume";

import { Text, Title } from "./typography";
import { entryBullet, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";

/**
 * A section the user named.
 *
 * Classic writes its own bullets rather than sharing `CustomLines` with the other
 * seven templates: its disc and its text are typography components carrying the
 * serif scale, not two entries in a stylesheet, and threading those through a
 * shared component would mean giving that component a second shape for one
 * template. `projects.tsx` beside it draws its bullets the same way.
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
    <View style={{ marginBottom: 12 }}>
      <Title>{section.title}</Title>

      {/* Every line its own block: a custom section has no entry to hold
          together, so the page may end between any two of them.

          A plain column rather than `splitEntryList`, whose negative top margin
          exists to cancel the one an `entryHead` opens a run with. There is no
          entry head here, so it would pull the first line up under the title. */}
      <View style={styles.flexCol}>
        {toBulletLines(section.description).map((line, index) => (
          <AvoidBreak style={entryBullet} key={line + index}>
            <Text bold>•</Text>
            <Text>{line}</Text>
          </AvoidBreak>
        ))}
      </View>
    </View>
  );
};

export default CustomSectionBlock;
