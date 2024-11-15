import { View } from "@react-pdf/renderer";
import React from "react";
import { styles } from "./styles";
import { Title, Text, SubText } from "./typography";
import { Education as EducationType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

const Education = ({ educations }: { educations: EducationType[] }) => {
  return (
    <View style={{ paddingBottom: 12 }}>
      <Title>Education</Title>

      {educations.map((education) => (
        <View style={{ ...styles.flexCol, marginBottom: 12 }}>
          <Text bold>
            {education.degree}
            {education.major && ` of ${education.major}`}, {education.school}
          </Text>
          <SubText>{formatDateRange(education.timeline)}</SubText>
        </View>
      ))}
    </View>
  );
};

export default Education;
