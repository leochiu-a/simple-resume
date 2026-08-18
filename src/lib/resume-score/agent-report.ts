import { Resume } from "@/types/resume";

import { BulletMetric, measureResume } from "./metrics";
import { CheckResult, potentialGain, scoreResume } from "./rules";
import { opensWithHan } from "./verbs";

/**
 * Where a finding is, in the coordinates the write tools take.
 *
 * `entryIndex` is the same zero-based index `get-resume` reports and
 * `update-entry` accepts, so an agent can carry a finding
 * straight into the call that fixes it without searching for the text again.
 */
export interface FindingLocation {
  section: "employmentHistory" | "projects";
  entryIndex: number;
  entryLabel: string;
  /** Absent when the finding is about the entry rather than one of its bullets. */
  bulletIndex?: number;
  text: string;
}

export interface AgentFinding {
  id: string;
  title: string;
  status: "fail" | "warn";
  /** Points the score gains if this check is brought to a pass. Always 0 when advisory. */
  gain: number;
  /**
   * Reported but not scored, because the check's verdict is not reliable enough
   * to charge points for. Still worth acting on — an agent can read the flagged
   * text and judge where the rule cannot — but fixing it will not move `score`,
   * and an agent hill-climbing on the number should not treat a stubborn
   * advisory finding as a failure to make progress.
   */
  advisory: boolean;
  detail: string;
  locations: FindingLocation[];
}

export interface AgentScoreReport {
  score: number;
  band: "weak" | "fair" | "strong";
  /** What the score is out of once hidden sections are excluded. Always 100. */
  outOf: 100;
  findings: AgentFinding[];
  passing: string[];
  notes: string[];
}

/**
 * The bullets a given check was complaining about.
 *
 * The rules keep their evidence as plain strings, because that is what the panel
 * renders. An agent needs the coordinates instead, so the offending bullets are
 * recovered by re-running each rule's predicate over the measured bullets. That
 * duplicates a condition or two, which is the price of not threading locations
 * through a scoring path whose only other consumer draws them as italic text.
 */
const locate = (id: string, bullets: BulletMetric[]): FindingLocation[] => {
  const at = (bullet: BulletMetric): FindingLocation => ({
    section: bullet.section,
    entryIndex: bullet.entryIndex,
    entryLabel: bullet.entryLabel,
    bulletIndex: bullet.bulletIndex,
    text: bullet.text,
  });

  switch (id) {
    case "quantified":
      return bullets.filter((bullet) => !bullet.hasNumber).map(at);
    case "action-verbs":
      return bullets.filter((bullet) => bullet.opener !== "action").map(at);
    case "bullet-length":
      return bullets.filter((bullet) => bullet.wordCount > 30 || bullet.wordCount < 4).map(at);
    default:
      return [];
  }
};

/**
 * Caveats the agent should weigh before acting on a finding, rather than
 * silently inheriting the scorer's blind spots.
 *
 * The verb check is the one rule here that cannot be decided by shape: it
 * matches opening words against a fixed list, so it misses verbs the list has
 * never heard of and, in Chinese, cannot tell a verb from the noun that starts
 * with the same characters (管理團隊 against 管理層). An agent reading the flagged
 * line can make that judgement where the list cannot — but only if it is told
 * the check is fallible, which is what this note is for.
 *
 * Which caveat applies is read off the flagged lines themselves, for the same
 * reason `classifyOpener` reads the script off the line: the editor's locale is
 * not evidence of what language the resume is written in.
 */
const noteFor = (id: string, locations: FindingLocation[]): string | null => {
  if (id !== "action-verbs") return null;

  const caveats = [
    locations.some((location) => opensWithHan(location.text)) &&
      "In Chinese it cannot separate a verb from a noun sharing the same prefix — 管理團隊 and 管理層 both match 管理.",
    locations.some((location) => !opensWithHan(location.text)) &&
      "In English it flags verbs the list does not know (Instrumented, Containerised, Deprecated).",
  ].filter((caveat): caveat is string => typeof caveat === "string");

  return [
    "The action-verb check matches a line's opening word against a fixed list, chosen per line by the script that line is written in.",
    ...caveats,
    "Read each flagged line before rewriting it.",
    "It is advisory: it carries no points, so fixing it will not move the score, and a line you judge to be fine can be left alone.",
  ].join(" ");
};

/**
 * The scorer, shaped for an agent rather than a panel.
 *
 * Reports state and location; it does not say which tool to call or in what
 * order. That is deliberate. Naming a tool in a result would couple the scorer
 * to a tool set that gets renamed, cap the agent at the fix this file happened
 * to imagine, and turn a data channel into a command channel — an agent that
 * runs instructions found in tool output carries that habit to every other site
 * it visits. Facts leave the plan where it belongs.
 */
export const buildAgentReport = (resume: Resume): AgentScoreReport => {
  const metrics = measureResume(resume);
  const { score, checks, issues, applicableWeight } = scoreResume(metrics, resume);

  const findings = issues.map(
    (check: CheckResult): AgentFinding => ({
      id: check.id,
      title: check.title,
      status: check.status === "fail" ? "fail" : "warn",
      gain: potentialGain(check, applicableWeight),
      advisory: check.advisory === true,
      detail: check.detail,
      locations: locate(check.id, metrics.bullets),
    }),
  );

  const notes = findings
    .map((finding) => noteFor(finding.id, finding.locations))
    .filter((note): note is string => note !== null);

  return {
    score,
    band: score >= 80 ? "strong" : score >= 55 ? "fair" : "weak",
    outOf: 100,
    findings,
    passing: checks.filter((check) => check.status === "pass").map((check) => check.title),
    notes,
  };
};
