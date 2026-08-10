import { View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import { toParagraphs } from "@/lib/paragraphs";

import { Text, Title } from "./typography";

/** See `summary.tsx`: a `<view>` is inline in the preview unless it says otherwise. */
const BLOCK: Style = { display: "flex", flexDirection: "column" };

/**
 * A block per paragraph and a `Text` per typed line within it — see `summary.tsx`
 * for why the preview needs the line grid. This template keeps its own copy of
 * the loop because its body type comes from the local typography components
 * rather than a style object, which is what the shared `Summary` takes.
 */
const Profile = ({ profile }: { profile: string }) => {
  const paragraphs = toParagraphs(profile);

  return (
    <View style={{ marginBottom: 12, width: "100%" }}>
      <Title>Profile</Title>

      {paragraphs.map((paragraph, index) => (
        <View key={index} style={index > 0 ? { ...BLOCK, marginTop: "6pt" } : BLOCK}>
          {paragraph.split("\n").map((line, lineIndex) => (
            <View key={lineIndex} style={BLOCK}>
              <Text>{line}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

export default Profile;
