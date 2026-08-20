import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { EmploymentHistory } from "@/types/resume";
import formatMarginDateRange from "./format-date";

import Section from "./section";
import { bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks, BulletRow } from "../bullet-row";

/**
 * The section the whole template is built around: the date range hangs in the
 * left margin, flush right, and the job sits in the column beside it.
 *
 * A role is deliberately *not* one unbreakable block. Held together, a long entry
 * that does not fit in what is left of a page moves onto the next one whole and
 * leaves a hole where it was — on a ten-bullet job that hole is most of a page.
 * What actually has to be protected is smaller: a headline must never be the last
 * thing on a page, and no single bullet may be split down the middle.
 *
 * So the entry is a run of blocks rather than one. `entryHead` binds the date, the
 * headline and the company to the first bullet — that is the keep-with-next, and
 * it is why the headline cannot be stranded. Every later bullet is its own
 * unbreakable block, so the page may break between any two of them.
 *
 * Each of those later bullets carries an empty gutter of its own. Without it a
 * bullet is a row that starts at the page's margin rather than at the entry
 * column's edge, so the moment a role's bullets outrun its headline they slide
 * left underneath the dates.
 */
const Experience = ({
  employmentHistory,
  accent,
}: {
  employmentHistory: EmploymentHistory[];
  accent: string;
}) => {
  return (
    <Section title="Experience" accent={accent}>
      <View style={styles.splitEntryList}>
        {employmentHistory.map(({ company, jobTitle, timeline, description }, index) => {
          const [firstBullet, ...restBullets] = toBulletLines(description);

          return (
            // A fragment, not a View: a wrapper here would be one box again, and
            // the blocks inside it could no longer be placed on separate pages.
            <Fragment key={index}>
              <AvoidBreak style={styles.entryHead}>
                <Text style={styles.dateColumn}>{formatMarginDateRange(timeline, "Present")}</Text>

                <View style={styles.entryColumn}>
                  <Text style={styles.entryHeadline}>{jobTitle}</Text>
                  <Text style={styles.entrySubline}>{company}</Text>

                  {firstBullet !== undefined && (
                    <BulletRow
                      line={firstBullet}
                      style={styles.descriptionRow}
                      styles={bulletStyles}
                    />
                  )}
                </View>
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak style={styles.entryBullet} key={item + itemIndex}>
                  <View style={styles.dateColumnSpacer} />

                  <View style={styles.continuationBullet}>
                    <BulletMarks line={item} styles={bulletStyles} />
                  </View>
                </AvoidBreak>
              ))}
            </Fragment>
          );
        })}
      </View>
    </Section>
  );
};

export default Experience;
