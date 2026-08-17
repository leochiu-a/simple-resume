import { View, Text } from "@react-pdf/renderer";
import { Fragment } from "react";

import { EmploymentHistory } from "@/types/resume";
import formatDateRange from "@/lib/formatDateRange";
import { SPLIT_TEXT } from "@/constants/textarea-split-text";

import Section from "./section";
import { styles } from "./styles";
import AvoidBreak from "../avoid-break";

/**
 * The job title and its company share one line, with the dates against the right
 * margin — the line this template saves against every other one, which spends a
 * second row on the company.
 *
 * A role is deliberately *not* one unbreakable block. Held together, a long entry
 * that does not fit in what is left of a page moves onto the next one whole and
 * leaves a hole where it was — on a ten-bullet job that hole is most of a page.
 * What actually has to be protected is smaller: a headline must never be the last
 * thing on a page, and no single bullet may be split down the middle.
 *
 * So the entry is a run of blocks rather than one. `entryHead` binds the headline
 * to the first bullet — that is the keep-with-next, and it is why the headline
 * cannot be stranded. Every later bullet is its own unbreakable block, so the page
 * may break between any two of them.
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
          const [firstBullet, ...restBullets] = description
            .split(SPLIT_TEXT)
            .filter((item) => item.trim() !== "");

          return (
            // A fragment, not a View: a wrapper here would be one box again, and
            // the blocks inside it could no longer be placed on separate pages.
            <Fragment key={index}>
              <AvoidBreak style={styles.entryHead}>
                <View style={styles.entryTopRow}>
                  <Text style={styles.entryHeadline}>
                    <Text style={styles.entryHeadlineStrong}>{jobTitle}</Text>
                    {/* The comma belongs to the company, so a role with no
                        employer named does not trail one. */}
                    {company && `, ${company}`}
                  </Text>

                  <Text style={styles.entryDate}>{formatDateRange(timeline, "Present")}</Text>
                </View>

                {firstBullet !== undefined && (
                  <View style={styles.descriptionRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{firstBullet}</Text>
                  </View>
                )}
              </AvoidBreak>

              {restBullets.map((item, itemIndex) => (
                <AvoidBreak style={styles.entryBullet} key={item + itemIndex}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
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
