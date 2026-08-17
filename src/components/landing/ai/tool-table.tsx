/**
 * The 8 registered tools, grouped by what they are for.
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
    kind: "Write · fields",
    note: "Patches what you pass, leaves the rest.",
    tools: [
      ["update-resume", "Header, profile, skills and links — any subset of them"],
      ["set-section-layout", "The order sections run in, and which are shown"],
    ],
  },
  {
    kind: "Write · entries",
    note: "Add, patch, or remove one row at an index. Jobs, schools and projects share the trio.",
    tools: [
      ["add-entry", "Appends to a section and returns the index it landed at"],
      ["update-entry", "Patches one entry; bullets replace all of them"],
      ["remove-entry", "Removes one entry and renumbers the rest"],
    ],
  },
  {
    kind: "Write · judgement",
    note: "The agent's own opinion, kept out of the score.",
    tools: [["submit-review", "Publishes a written review into the score panel"]],
  },
];

const ToolTable = () => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
    {GROUPS.map((group) => (
      <div
        key={group.kind}
        className="rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-6 shadow-[var(--shadow-sm),var(--highlight)]"
      >
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--accent)]">
          {group.kind}
        </p>
        <p className="mt-2 text-[0.875rem] leading-[1.55] text-[var(--graphite-soft)]">
          {group.note}
        </p>

        <dl className="mt-5 space-y-0">
          {group.tools.map(([name, description]) => (
            <div
              key={name}
              className="border-t border-[var(--rule)] py-3 last:pb-0 sm:flex sm:items-baseline sm:gap-4"
            >
              <dt className="shrink-0 font-mono text-[0.8125rem] text-[var(--graphite)] sm:w-[11.5rem]">
                {name}
              </dt>
              <dd className="mt-1 text-[0.875rem] leading-[1.55] text-[var(--graphite-soft)] sm:mt-0">
                {description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    ))}
  </div>
);

export default ToolTable;
