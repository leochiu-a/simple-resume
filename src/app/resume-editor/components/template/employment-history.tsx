import { View } from "@react-pdf/renderer";
import { Title, Text, SubText } from "./typography";
import { styles } from "./styles";
import { EmploymentHistory as EmploymentHistoryType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

const EmploymentHistory = ({
  employmentHistory,
}: {
  employmentHistory: EmploymentHistoryType[];
}) => {
  return (
    <View style={{ marginBottom: 12 }}>
      <Title>Employment History</Title>

      <View style={{ ...styles.flexCol, gap: "12pt" }}>
        {employmentHistory.map(
          ({ company, timeline, jobTitle, description }, index) => (
            <View key={index} wrap={false}>
              <View style={{ ...styles.flexCol, marginBottom: 8 }}>
                <Text bold>
                  {jobTitle}, {company}
                </Text>
                <SubText>{formatDateRange(timeline)}</SubText>
              </View>

              {description.split(",").map((item, index) => (
                <View
                  key={item + index}
                  style={{ ...styles.flexRow, gap: "4pt", paddingLeft: "12px" }}
                  wrap={false}
                >
                  <Text bold>•</Text>
                  <Text>{item}</Text>
                </View>
              ))}
            </View>
          )
        )}
      </View>
    </View>
  );
};

export default EmploymentHistory;
