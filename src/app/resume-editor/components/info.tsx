import { View } from "@react-pdf/renderer";
import { Text, Title } from "./typography";
import { styles } from "./styles";

const Info = () => {
  return (
    <View
      style={{
        color: "#fff",
        ...styles.flexCol,
        alignItems: "center",
      }}
    >
      <View style={{ marginHorizontal: 40, marginTop: 40 }}>
        <Title>Name</Title>
      </View>
      <View
        style={{ height: 1, width: 20, backgroundColor: "#3B7269", margin: 10 }}
      ></View>
      <Text
        style={{
          fontSize: 9,
          transform: "scale(0.7)",
          // width: "151px",
          letterSpacing: 1.5,
        }}
      >
        FRONTEND ENGINEER
      </Text>

      <View
        style={{
          alignSelf: "flex-start",
          marginLeft: 40,
          marginTop: 20,
          ...styles.flexCol,
          gap: 20,
        }}
      >
        <View style={{ ...styles.flexCol }}>
          <Title>Detail</Title>
          <Text>Taipei</Text>
          <Text>0123456789</Text>
          <Text>good@gmail.com</Text>
        </View>

        <View style={{ ...styles.flexCol }}>
          <Title>Link</Title>
          <Text>Medium</Text>
          <Text>GitHub</Text>
          <Text>Thread</Text>
        </View>

        <View style={{ ...styles.flexCol, alignItems: "flex-start" }}>
          <Title>Skills</Title>
          <Text>TypeScript</Text>
          <Text>React</Text>
          <Text>Next.js</Text>
          <Text>GraphQL</Text>
          <Text>Redux</Text>
        </View>
      </View>
    </View>
  );
};

export default Info;
