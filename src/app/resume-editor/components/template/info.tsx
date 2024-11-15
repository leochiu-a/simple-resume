import { View } from "@react-pdf/renderer";
import { SmallText, SubText, SubTitle, Title } from "../typography";
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
      <View style={{ marginHorizontal: "40pt", marginTop: "40pt" }}>
        <Title style={{ fontSize: "16pt", marginBottom: 0 }}>Name</Title>
      </View>
      <View
        style={{
          height: "1pt",
          width: "12pt",
          backgroundColor: "#3B7269",
          margin: "10pt",
        }}
      ></View>
      <SubText style={{ transformOrigin: "center", color: "#fff" }}>
        FRONTEND ENGINEER
      </SubText>

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
          <SubTitle>Details</SubTitle>
          <View style={{ ...styles.flexCol, gap: "2pt" }}>
            <SmallText>Taipei</SmallText>
            <SmallText>0123456789</SmallText>
            <SmallText style={{ textDecoration: "underline" }}>
              good@gmail.com
            </SmallText>
          </View>
        </View>

        <View style={{ ...styles.flexCol }}>
          <SubTitle>Links</SubTitle>
          <View style={{ ...styles.flexCol, gap: "8pt" }}>
            <SmallText as="link" href="https://medium.com">
              Medium
            </SmallText>
            <SmallText as="link" href="https://github.com">
              GitHub
            </SmallText>
            <SmallText as="link" href="https://threads.com">
              Threads
            </SmallText>
            <SmallText as="link" href="https://threads.com">
              Threads
            </SmallText>
          </View>
        </View>

        <View style={{ ...styles.flexCol }}>
          <SubTitle>Skills</SubTitle>
          <View style={{ ...styles.flexCol, gap: "6pt" }}>
            <SmallText>TypeScript</SmallText>
            <SmallText>React</SmallText>
            <SmallText>Next.js</SmallText>
            <SmallText>GraphQL</SmallText>
            <SmallText>Redux</SmallText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Info;