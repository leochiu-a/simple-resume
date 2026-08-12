/**
 * The 17 registered tools, grouped by what they are for.
 *
 * The names are the `name` fields in `webmcp/resume-tools.ts` — the strings an
 * agent actually calls — so this table is checkable against the source rather
 * than a paraphrase of it. Read tools are separated from write tools because
 * that is the distinction that matters to someone deciding whether to point an
 * agent at their resume: two of these answer questions, the rest change the page.
 */
const GROUPS = [
  {
    kind: "Read",
    note: "Answers a question. Changes nothing.",
    tools: [
      ["get-resume", "The whole resume as JSON, with an index on every list entry"],
      ["score-resume", "Grades it against twelve rules and says where each one fails"],
    ],
  },
  {
    kind: "Write · sections",
    note: "Patches what you pass, leaves the rest.",
    tools: [
      ["update-basic-info", "Name, target role, city, phone, email"],
      ["update-profile", "Replaces the summary paragraph"],
      ["set-skills", "Replaces the whole skill list, in display order"],
      ["set-social-links", "Replaces the whole link list"],
      ["set-section-visibility", "Shows or hides a section — content is kept"],
    ],
  },
  {
    kind: "Write · entries",
    note: "Add, patch, or remove one row at an index.",
    tools: [
      ["add-employment", "Appends a job and returns the index it landed at"],
      ["update-employment", "Patches one job; bullets replace all of them"],
      ["remove-employment", "Removes a job and renumbers the rest"],
      ["add-education", "Appends a school"],
      ["update-education", "Patches one school"],
      ["remove-education", "Removes a school"],
      ["add-project", "Appends a project"],
      ["update-project", "Patches one project"],
      ["remove-project", "Removes a project"],
    ],
  },
  {
    kind: "Write · judgement",
    note: "The agent's own opinion, kept out of the score.",
    tools: [["submit-review", "Publishes a written review into the score panel"]],
  },
];

const ToolTable = () => (
  <div className="border-t border-[var(--rule)]">
    {GROUPS.map((group) => (
      <div key={group.kind} className="border-b border-[var(--rule)] py-7">
        <div className="grid grid-cols-1 gap-y-5 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              {group.kind}
            </p>
            <p className="mt-2 max-w-[24ch] text-[0.82rem] leading-[1.6] text-[var(--graphite-soft)]">
              {group.note}
            </p>
          </div>

          <dl className="lg:col-span-9">
            {group.tools.map(([name, description]) => (
              <div
                key={name}
                className="flex flex-col gap-1 border-b border-dashed border-[var(--rule)] py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <dt className="shrink-0 font-mono text-[0.8rem] text-[var(--graphite)] sm:w-[13.5rem]">
                  {name}
                </dt>
                <dd className="text-[0.88rem] leading-[1.6] text-[var(--graphite-soft)]">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    ))}
  </div>
);

export default ToolTable;
