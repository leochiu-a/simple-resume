import { View } from "@react-pdf/renderer";
import React from "react";
import { styles } from "./styles";
import { Title, Text, SubText } from "./typography";

const Education = () => {
  return (
    <View style={{ marginBottom: 12 }}>
      <Title>Education</Title>

      <View style={{ ...styles.flexCol, marginBottom: 12 }}>
        <Text bold>Lorem</Text>
        <SubText>OCTOBER 2020 — NOVEMBER 2024</SubText>
      </View>

      <View style={{ ...styles.flexCol, marginBottom: 12 }}>
        <Text bold>Lorem</Text>
        <SubText>OCTOBER 2020 — NOVEMBER 2024</SubText>
      </View>
    </View>
  );
};

export default Education;
