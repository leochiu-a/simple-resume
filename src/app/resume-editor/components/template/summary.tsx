import { View, Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import { toParagraphs } from "@/lib/paragraphs";

/**
 * Spelled out because the preview renders these same style objects as CSS, where
 * an unknown `<view>` element is inline — and `use-pagination` shifts a block, so
 * a line that is not one gets shifted by way of its nearest ancestor that is,
 * carrying the lines above it along.
 */
const BLOCK: Style = { display: "flex", flexDirection: "column" };

/**
 * The profile, rendered as the paragraphs it was typed as.
 *
 * Shared by every template but Classic, which sets the profile inside its own
 * sidebar layout. The fix is the same in each and the bug was too: every one of
 * them passed the raw string to a single `Text`, which collapses the newlines. Only the type styling differs, so that is the prop.
 *
 * A paragraph is its own block, and so is each line the writer typed within it.
 * @react-pdf would honour a literal `\n` inside a single `Text`, so this is not
 * what the PDF needs — it is what the preview needs. The preview paginates by
 * moving whole blocks, so a block is the smallest thing it can put on the next
 * page: a profile held in one `Text` is one indivisible slab several pages tall,
 * and a page's margins cannot be opened inside it. Split per line, the same
 * profile is a grid of blocks a break can fall between.
 *
 * The `View` around each line is what makes it a block. @react-pdf lays a `Text`
 * out as one either way, but the preview renders that same tree as HTML, where an
 * unknown `<text>` element is inline — and a margin, which is how the preview
 * moves things, does nothing to an inline box.
 */
const Summary = ({ profile, style }: { profile: string; style?: Style }) => {
  const paragraphs = toParagraphs(profile);

  if (paragraphs.length === 0) return null;

  return (
    <View style={{ display: "flex", flexDirection: "column", rowGap: 6 }}>
      {paragraphs.map((paragraph, index) => (
        <View key={index} style={BLOCK}>
          {paragraph.split("\n").map((line, lineIndex) => (
            <View key={lineIndex} style={BLOCK}>
              <Text style={style}>{line}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

export default Summary;
