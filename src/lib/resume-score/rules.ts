import { Resume } from "@/types/resume";

import { ResumeMetrics } from "./metrics";

export type CheckStatus = "pass" | "warn" | "fail" | "skipped";

export type CheckGroup = "content" | "impact" | "format" | "contact";

/**
 * What one rule reports.
 *
 * `earned` and `weight` are points, not percentages: the panel turns a rule's
 * unearned points into the "+N%" it advertises, and doing that arithmetic in one
 * place is what keeps the promise honest. A rule that says "+4%" must move the
 * total by 4 when you fix it, and the only way to guarantee that is to derive
 * the number from the same weight the total is built from.
 *
 * `skipped` exists so a rule can decline to judge a section that is not there:
 * a resume with Projects switched off should not be marked down for having no
 * project bullets, and it should not be marked *up* either — a skipped rule
 * leaves the denominator, so the remaining rules still total 100.
 */
export interface CheckResult {
  id: string;
  group: CheckGroup;
  title: string;
  status: CheckStatus;
  weight: number;
  earned: number;
  /** What is wrong, in one sentence. Empty when the check passes. */
  detail: string;
  /** The examples the detail refers to — company names, offending bullets. */
  evidence?: string[];
  /**
   * Reported to the reader but excluded from the score.
   *
   * For a check whose finding is worth seeing but whose verdict is not reliable
   * enough to charge points for. The rule still runs, still names the lines it
   * objects to, and still appears in the panel — it just carries no weight and
   * advertises no "+N%", because a gain the reader cannot trust is worse than no
   * number at all.
   *
   * Only `action-verbs` is advisory today; see the note at that rule.
   */
  advisory?: boolean;
}

interface Rule {
  id: string;
  group: CheckGroup;
  title: string;
  weight: number;
  /** See `CheckResult.advisory`. */
  advisory?: boolean;
  run: (
    metrics: ResumeMetrics,
    resume: Resume,
  ) => Omit<CheckResult, "id" | "group" | "title" | "weight">;
}

/** A rule that is not applicable right now — see `skipped` above. */
const skip = (): Omit<CheckResult, "id" | "group" | "title" | "weight"> => ({
  status: "skipped",
  earned: 0,
  detail: "",
});

/** Caps an evidence list so one bad section cannot produce a wall of text. */
const sample = (items: string[], limit = 3) => items.slice(0, limit);

/**
 * The rule set.
 *
 * Weights are the editorial judgement in this feature, so they are stated in one
 * table rather than scattered: quantified results carry the most because a number
 * is what a reader remembers, describing every role carries nearly as much
 * because an undescribed job reads as a gap, contact completeness carries a
 * little because it is pass/fail and cheap to fix, and length carries least
 * because the right answer genuinely depends on seniority.
 *
 * A rule only carries weight if its verdict is one code can defend. `action-verbs`
 * is scored at 0 for that reason — see the note above it — and its 14 points were
 * split between `quantified` (+6), `bullets-per-entry` (+4) and `bullet-length`
 * (+4), all of which measure rather than guess.
 *
 * The scored rules sum to 100 when every one applies. When some are skipped the
 * total is rescaled — see `scoreResume`.
 */
const RULES: Rule[] = [
  {
    id: "quantified",
    group: "impact",
    title: "Quantified results",
    weight: 22,
    run: (metrics) => {
      const { bullets } = metrics;
      if (bullets.length === 0) return skip();

      const withNumbers = bullets.filter((bullet) => bullet.hasNumber);
      const ratio = withNumbers.length / bullets.length;
      // A third is the bar: not every bullet can carry a metric honestly, and a
      // rule that demanded one on all of them would push writers to invent them.
      const earned = Math.round(Math.min(ratio / 0.34, 1) * 22);

      if (ratio >= 0.34) {
        return {
          status: "pass" as const,
          earned,
          detail: "",
        };
      }
      return {
        status: ratio === 0 ? ("fail" as const) : ("warn" as const),
        earned,
        detail:
          withNumbers.length === 0
            ? "No bullet carries a number. Numbers are what a reader remembers — add scale, percentage or time saved to your strongest lines."
            : `Only ${withNumbers.length} of ${bullets.length} bullets carry a number. Aim for about a third.`,
        evidence: sample(
          bullets.filter((bullet) => !bullet.hasNumber).map((bullet) => bullet.text),
        ),
      };
    },
  },
  /*
    Advisory, and the only rule here that is.

    Every other check in this table decides something a regex genuinely settles:
    is there a digit in this line, how many words, is the field empty. This one
    has to decide whether a word is a verb, and it does that by matching the
    opening token against a fixed list — which is not the same question. It
    misses verbs the list has never met (Instrumented, Containerised,
    Deprecated), and in Chinese it cannot separate a verb from a noun that starts
    with the same characters: 管理團隊 and 管理層 share 管理, 設計模式 shares 設計.
    Measured against a dozen hand-written cases it got seven wrong, all three
    Chinese noun cases among them.

    No word list closes that gap, because the ambiguity is in what follows the
    prefix rather than the prefix itself. Segmenting Chinese properly means
    shipping a model, which this app will not do for one check.

    So the finding stays and the points go. A reader still sees which lines open
    weakly and can judge for themselves — that advice is useful even when it is
    wrong, because it costs a glance. Charging 14 points for it is different:
    that is a number the panel cannot justify, attached to the one rule most
    likely to be unfair to a Chinese resume.

    An agent reading `score-resume` still gets this finding at full detail, and
    tolerates the false positives fine — it can read 管理層 and see a noun. That
    is the right division: the arithmetic stays with what code decides exactly,
    and the judgement goes to whoever can actually judge.
  */
  {
    id: "action-verbs",
    group: "impact",
    title: "Bullets open with an action verb",
    weight: 0,
    advisory: true,
    run: (metrics) => {
      const { bullets } = metrics;
      if (bullets.length === 0) return skip();

      const weak = bullets.filter((bullet) => bullet.opener !== "action");
      const duties = bullets.filter((bullet) => bullet.opener === "duty");

      if (weak.length === 0) return { status: "pass" as const, earned: 0, detail: "" };

      return {
        // Never `fail`: a check that cannot be trusted to charge points should
        // not be shouting either.
        status: "warn" as const,
        earned: 0,
        detail:
          duties.length > 0
            ? `${weak.length} bullets may not open with an action verb, and ${duties.length} describe a duty rather than a result. Leading with what you did reads stronger — check these, as this test is approximate.`
            : `${weak.length} of ${bullets.length} bullets may not open with an action verb. This test matches the first word against a fixed list, so read them before rewriting — some will be fine.`,
        evidence: sample(weak.map((bullet) => bullet.text)),
      };
    },
  },
  {
    id: "bullet-length",
    group: "format",
    title: "Bullet length",
    weight: 12,
    run: (metrics) => {
      const { bullets } = metrics;
      if (bullets.length === 0) return skip();

      // Under four words is a fragment, over thirty is a paragraph wearing a
      // bullet's clothes. Both are read past rather than read.
      const tooLong = bullets.filter((bullet) => bullet.wordCount > 30);
      const tooShort = bullets.filter((bullet) => bullet.wordCount < 4);
      const offenders = [...tooLong, ...tooShort];
      const earned = Math.round(((bullets.length - offenders.length) / bullets.length) * 12);

      if (offenders.length === 0) return { status: "pass" as const, earned, detail: "" };

      // "1 bullet runs" / "2 bullets run" — the count drives the verb, and a
      // detail line that reads "1 are under 4 words" undercuts every other
      // sentence in the panel.
      const count = (n: number, singular: string, plural: string) =>
        `${n} ${n === 1 ? "bullet" : "bullets"} ${n === 1 ? singular : plural}`;

      const parts: string[] = [];
      if (tooLong.length > 0) parts.push(count(tooLong.length, "runs", "run") + " past 30 words");
      if (tooShort.length > 0) parts.push(count(tooShort.length, "is", "are") + " under 4 words");

      return {
        status: "warn" as const,
        earned,
        detail: `${parts.join(" and ")}. Aim for one line each — roughly 8 to 25 words.`,
        evidence: sample(offenders.map((bullet) => bullet.text)),
      };
    },
  },
  {
    id: "bullets-per-entry",
    group: "content",
    title: "Every role is described",
    weight: 14,
    run: (metrics) => {
      const { entries } = metrics;
      if (entries.length === 0) return skip();

      const empty = entries.filter((entry) => entry.bulletCount === 0);
      const thin = entries.filter((entry) => entry.bulletCount > 0 && entry.bulletCount < 2);
      const earned = Math.round(
        ((entries.length - empty.length - thin.length * 0.5) / entries.length) * 14,
      );

      if (empty.length === 0 && thin.length === 0) {
        return { status: "pass" as const, earned, detail: "" };
      }

      return {
        status: empty.length > 0 ? ("fail" as const) : ("warn" as const),
        earned: Math.max(earned, 0),
        detail:
          empty.length > 0
            ? `${empty.length} entries have no bullets at all. An undescribed role reads as a gap.`
            : `${thin.length} entries have only one bullet. Two to five is what a reader expects.`,
        evidence: sample([...empty, ...thin].map((entry) => entry.label || "Untitled entry")),
      };
    },
  },
  {
    id: "profile",
    group: "content",
    title: "Profile summary",
    weight: 8,
    run: (metrics, resume) => {
      if (!resume.visibility.profile) return skip();

      const words = metrics.profileWordCount;
      if (words === 0) {
        return {
          status: "fail" as const,
          earned: 0,
          detail:
            "The profile is empty. Three or four lines naming your role, your years and your focus is what a reader reads first.",
        };
      }
      if (words < 25) {
        return {
          status: "warn" as const,
          earned: 4,
          detail: `The profile is ${words} words. Around 40 to 80 gives you room to say what you do and what you are after.`,
        };
      }
      if (words > 120) {
        return {
          status: "warn" as const,
          earned: 5,
          detail: `The profile is ${words} words — long enough that it competes with your experience. Trim to under 100.`,
        };
      }
      return { status: "pass" as const, earned: 8, detail: "" };
    },
  },
  {
    id: "length",
    group: "format",
    title: "Overall length",
    weight: 6,
    run: (metrics) => {
      const words = metrics.totalWordCount;
      // ~450 words is a comfortable single page in these templates; ~1000 is
      // where a second page stops being a choice.
      if (words < 150) {
        return {
          status: "fail" as const,
          earned: 0,
          detail: `About ${words} words — well under a page. There is not yet enough here for a reader to judge you on.`,
        };
      }
      if (words < 250) {
        return {
          status: "warn" as const,
          earned: 3,
          detail: `About ${words} words. Most of a page is still empty; add detail to your recent roles.`,
        };
      }
      if (words > 1000) {
        return {
          status: "warn" as const,
          earned: 3,
          detail: `About ${words} words — that is past two pages. Cut the oldest roles back to a line each.`,
        };
      }
      return { status: "pass" as const, earned: 6, detail: "" };
    },
  },
  {
    id: "contact",
    group: "contact",
    title: "Contact details",
    weight: 12,
    run: (_metrics, resume) => {
      const missing: string[] = [];
      if (!resume.name.trim()) missing.push("Name");
      if (!resume.email.trim()) missing.push("Email");
      if (!resume.phone.trim()) missing.push("Phone");
      if (!resume.city.trim()) missing.push("City");

      // Name and email are the two a recruiter cannot proceed without, so they
      // are worth more than the other two put together.
      const earned =
        (resume.name.trim() ? 4 : 0) +
        (resume.email.trim() ? 4 : 0) +
        (resume.phone.trim() ? 2 : 0) +
        (resume.city.trim() ? 2 : 0);

      if (missing.length === 0) return { status: "pass" as const, earned, detail: "" };

      const critical = missing.some((field) => field === "Name" || field === "Email");
      return {
        status: critical ? ("fail" as const) : ("warn" as const),
        earned,
        detail: `Missing ${missing.join(", ").toLowerCase()}. An ATS reads these first, and a resume it cannot attribute is a resume it discards.`,
        evidence: missing,
      };
    },
  },
  {
    id: "email-format",
    group: "contact",
    title: "Email looks valid",
    weight: 4,
    run: (_metrics, resume) => {
      const email = resume.email.trim();
      if (email === "") return skip();

      // Deliberately shallow: a full RFC 5322 check rejects addresses that work
      // and accepts ones that do not. This catches the typo the writer would
      // want caught — a missing @ or a bare domain.
      const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      return looksValid
        ? { status: "pass" as const, earned: 4, detail: "" }
        : {
            status: "fail" as const,
            earned: 0,
            detail: `"${email}" does not look like an email address. Check for a missing @ or domain.`,
          };
    },
  },
  {
    id: "wanted-job",
    group: "contact",
    title: "Target job title",
    weight: 6,
    run: (_metrics, resume) =>
      resume.wantedJob.trim()
        ? { status: "pass" as const, earned: 6, detail: "" }
        : {
            status: "warn" as const,
            earned: 0,
            detail:
              "No target job title. It is the line an ATS matches against the opening, and the first thing a human reads under your name.",
          },
  },
  {
    id: "skills",
    group: "content",
    title: "Skills listed",
    weight: 8,
    run: (metrics, resume) => {
      if (!resume.visibility.skills) return skip();

      const count = metrics.skillCount;
      if (count === 0) {
        return {
          status: "fail" as const,
          earned: 0,
          detail:
            "No skills listed. This is the section keyword filters read most literally — name your tools and languages.",
        };
      }
      if (count < 5) {
        return {
          status: "warn" as const,
          earned: 4,
          detail: `Only ${count} skills. Six to twelve is the range that reads as thorough without reading as padding.`,
        };
      }
      if (count > 25) {
        return {
          status: "warn" as const,
          earned: 5,
          detail: `${count} skills is long enough that none of them stand out. Keep the ones you would defend in an interview.`,
        };
      }
      return { status: "pass" as const, earned: 8, detail: "" };
    },
  },
  {
    id: "education",
    group: "content",
    title: "Education present",
    weight: 4,
    run: (metrics, resume) => {
      if (!resume.visibility.educations) return skip();
      return metrics.educationCount > 0
        ? { status: "pass" as const, earned: 4, detail: "" }
        : {
            status: "warn" as const,
            earned: 0,
            detail:
              "No education entries. Even one line is expected, and its absence reads as an omission rather than a choice.",
          };
    },
  },
  {
    id: "links",
    group: "contact",
    title: "A link to your work",
    weight: 4,
    run: (metrics, resume) => {
      if (!resume.visibility.socialLinks) return skip();
      return metrics.socialLinkCount > 0
        ? { status: "pass" as const, earned: 4, detail: "" }
        : {
            status: "warn" as const,
            earned: 0,
            detail:
              "No links. A GitHub, LinkedIn or portfolio URL is the cheapest evidence on the page.",
          };
    },
  },
];

export interface ScoreReport {
  /** 0–100, rescaled over the rules that actually applied. */
  score: number;
  checks: CheckResult[];
  /** Failing and warning checks, worst-first — the panel's to-do list. */
  issues: CheckResult[];
  /** What the score would be with every issue fixed. Always 100 by construction. */
  applicableWeight: number;
}

/**
 * Runs every rule and rescales.
 *
 * The rescale is why a hidden section costs nothing: skipped rules leave both
 * the numerator and the denominator, so a resume with Projects and Skills turned
 * off is still scored out of 100 — on the rules that remain.
 */
export const scoreResume = (metrics: ResumeMetrics, resume: Resume): ScoreReport => {
  const checks: CheckResult[] = RULES.map((rule) => {
    const outcome = rule.run(metrics, resume);
    return {
      id: rule.id,
      group: rule.group,
      title: rule.title,
      weight: rule.weight,
      advisory: rule.advisory,
      ...outcome,
    };
  });

  const applicable = checks.filter((check) => check.status !== "skipped");
  /* Advisory checks are weight 0, so they fall out of both sums on their own —
     no filtering needed here, and the score stays out of 100 over the rules that
     charge for themselves. */
  const applicableWeight = applicable.reduce((sum, check) => sum + check.weight, 0);
  const earned = applicable.reduce((sum, check) => sum + check.earned, 0);
  const score = applicableWeight === 0 ? 0 : Math.round((earned / applicableWeight) * 100);

  const issues = applicable
    .filter((check) => check.status !== "pass")
    .sort((a, b) => {
      // Scored findings before advisory ones: a reader working down the list
      // should meet everything that moves the number before anything that does
      // not, however strongly worded.
      const rank = (check: CheckResult) =>
        (check.advisory ? 2 : 0) + (check.status === "fail" ? 0 : 1);

      return rank(a) - rank(b) || b.weight - b.earned - (a.weight - a.earned);
    });

  return { score, checks, issues, applicableWeight };
};

/**
 * What fixing one check is worth, as the percentage the panel prints.
 *
 * Derived from the same weights the score is, and rounded the same way, so the
 * advertised "+4%" is the number the total actually moves by.
 */
export const potentialGain = (check: CheckResult, applicableWeight: number): number =>
  applicableWeight === 0 ? 0 : Math.round(((check.weight - check.earned) / applicableWeight) * 100);
