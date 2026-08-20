import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { EmploymentHistory } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";

import Section from "./section";
import { bulletStyles, styles } from "./styles";
import AvoidBreak from "../avoid-break";
import { toBulletLines } from "../bullets";
import { BulletMarks, BulletRow } from "../bullet-row";

/**
 * Each role headlines with its uppercased job title and, at a regular weight
 * and left as typed, the dates it ran for. The company follows at body size,
 * then the description as disc bullets.
 *
 * A role is deliberately *not* one unbreakable block. Held together, a long entry
 * that does not fit in what is left of a page moves onto the next one whole and
 * leaves a hole where it was — on a ten-bullet job that hole is most of a page.
 * What actually has to be protected is smaller: a headline must never be the last
 * thing on a page, and no single bullet may be split down the middle.
 *
 * So the entry is a run of blocks rather than one. `entryHead` binds the headline
 * and company to the first bullet — that is the keep-with-next, and it is why the
 * headline cannot be stranded. Every later bullet is its own unbreakable block, so
 * the page may break between any two of them.
 */
const Experience = ({ employmentHistory }: { employmentHistory: EmploymentHistory[] }) => {
  return (
    <Section title="Experience">
      <View style={styles.splitEntryList}>
        {employmentHistory.map(({ company, jobTitle, timeline, description }, index) => {
          const [firstBullet, ...restBullets] = toBulletLines(description);

          return (
            // A fragment, not a View: a wrapper here would be one box again, and
            // the blocks inside it could no longer be placed on separate pages.
            <Fragment key={index}>
              <AvoidBreak style={styles.entryHead}>
                <Text style={{ ...styles.entryHeadline, ...styles.entryHeadlineUpper }}>
                  {jobTitle}
                  <Text style={styles.entryHeadlineDate}>
                    {` | ${formatDateRange(timeline, "Present")}`}
                  </Text>
                </Text>

                <Text style={styles.entrySubline}>{company}</Text>

                {firstBullet !== undefined && (
                  <BulletRow
                    line={firstBullet}
                    style={styles.descriptionRow}
                    styles={bulletStyles}
                  />
                )}
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak style={styles.entryBullet} key={item + itemIndex}>
                  <BulletMarks line={item} styles={bulletStyles} />
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
