import { View, Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import { toParagraphs } from "@/lib/paragraphs";

/**
 * The profile, rendered as the paragraphs it was typed as.
 *
 * Shared by all four templates because the fix is the same in each and the bug
 * was too: every one of them passed the raw string to a single `Text`, which
 * collapses the newlines. Only the type styling differs, so that is the prop.
 *
 * A paragraph is one `Text` rather than the whole profile being one: separate
 * blocks are what let the gap between them exist, and they give the preview's
 * paginator a line grid it can break between. Within a paragraph the newlines
 * are kept — @react-pdf honours a literal `\n` inside a `Text`.
 */
const Summary = ({ profile, style }: { profile: string; style?: Style }) => {
  const paragraphs = toParagraphs(profile);

  if (paragraphs.length === 0) return null;

  return (
    <View style={{ display: "flex", flexDirection: "column", rowGap: 6 }}>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={style}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
};

export default Summary;
