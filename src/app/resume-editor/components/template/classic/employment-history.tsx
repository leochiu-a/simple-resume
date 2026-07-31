import { View } from "@react-pdf/renderer";
import { Title, Text, SubText } from "./typography";
import { styles } from "./styles";
import { EmploymentHistory as EmploymentHistoryType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import AvoidBreak from "../avoid-break";

const EmploymentHistory = ({
  employmentHistory,
}: {
  employmentHistory: EmploymentHistoryType[];
}) => {
  return (
    <View style={{ marginBottom: 12 }}>
      <Title>Employment History</Title>

      <View style={{ ...styles.flexCol, gap: "12pt" }}>
        {employmentHistory.map(({ company, timeline, jobTitle, description }, index) => (
          <AvoidBreak key={index}>
            <View style={{ ...styles.flexCol, marginBottom: 8 }}>
              <Text bold>
                {jobTitle}, {company}
              </Text>
              <SubText>{formatDateRange(timeline, "Present")}</SubText>
            </View>

            {description.split(SPLIT_TEXT).map((item, index) => (
              <AvoidBreak
                key={item + index}
                style={{ ...styles.flexRow, gap: "4pt", paddingLeft: "12px" }}
              >
                <Text bold>•</Text>
                <Text>{item}</Text>
              </AvoidBreak>
            ))}
          </AvoidBreak>
        ))}
      </View>
    </View>
  );
};

export default EmploymentHistory;
