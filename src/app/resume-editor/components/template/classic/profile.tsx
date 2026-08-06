import { View } from "@react-pdf/renderer";

import { toParagraphs } from "@/lib/paragraphs";

import { Text, Title } from "./typography";

/**
 * One `Text` per paragraph rather than one for the whole profile — see
 * `lib/paragraphs`. This template keeps its own copy of the loop because its
 * body type comes from the local typography components rather than a style
 * object, which is what the shared `Summary` takes.
 */
const Profile = ({ profile }: { profile: string }) => {
  const paragraphs = toParagraphs(profile);

  return (
    <View style={{ marginBottom: 12, width: "100%" }}>
      <Title>Profile</Title>

      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={index > 0 ? { marginTop: "6pt" } : undefined}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
};

export default Profile;
