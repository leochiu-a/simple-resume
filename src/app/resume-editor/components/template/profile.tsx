import { View } from "@react-pdf/renderer";
import { Text, Title } from "./typography";

const Profile = ({ profile }: { profile: string }) => {
  return (
    <View style={{ marginBottom: 12, width: "100%" }}>
      <Title>Profile</Title>

      <Text>{profile}</Text>
    </View>
  );
};

export default Profile;
