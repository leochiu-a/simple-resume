import { View } from "@react-pdf/renderer";
import { Fragment } from "react";
import { Title, Text, SubText } from "./typography";
import { styles, entryBullet, entryHead, splitEntryList } from "./styles";
import { EmploymentHistory as EmploymentHistoryType } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import AvoidBreak from "../avoid-break";

/**
 * A job is a run of unbreakable blocks rather than one, so that a long entry
 * spills down the page instead of jumping off it. `entryHead` binds the title and
 * dates to the first bullet — the headline can never be stranded — and every later
 * bullet stands alone, so the break may fall between any two of them.
 *
 * Held together as one block, an entry that did not fit in what was left of a page
 * moved onto the next whole and left a hole most of a page tall behind it. The
 * nested `AvoidBreak` on each bullet never got to matter, because the outer block
 * was resolved first and moved the lot.
 */
const EmploymentHistory = ({
  employmentHistory,
}: {
  employmentHistory: EmploymentHistoryType[];
}) => {
  return (
    <View style={{ marginBottom: 12 }}>
      <Title>Employment History</Title>

      <View style={splitEntryList}>
        {employmentHistory.map(({ company, timeline, jobTitle, description }, index) => {
          const [firstBullet, ...restBullets] = description.split(SPLIT_TEXT);

          return (
            // A fragment, not a View: a wrapper would be one box again, and the
            // blocks inside it could no longer be placed on separate pages.
            <Fragment key={index}>
              <AvoidBreak style={entryHead}>
                <View style={{ ...styles.flexCol, marginBottom: 8 }}>
                  <Text bold>
                    {jobTitle}, {company}
                  </Text>
                  <SubText>{formatDateRange(timeline, "Present")}</SubText>
                </View>

                {firstBullet !== undefined && (
                  <View style={{ ...styles.flexRow, gap: "4pt", paddingLeft: "12px" }}>
                    <Text bold>•</Text>
                    <Text>{firstBullet}</Text>
                  </View>
                )}
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak key={item + itemIndex} style={entryBullet}>
                  <Text bold>•</Text>
                  <Text>{item}</Text>
                </AvoidBreak>
              ))}
            </Fragment>
          );
        })}
      </View>
    </View>
  );
};

export default EmploymentHistory;
