import { describe, expect, it } from "vitest";

import { emptyResume, jobWith, projectWith, words } from "@/test/resume-fixture";
import { Resume } from "@/types/resume";

import { measureResume } from "./metrics";
import { potentialGain, scoreResume } from "./rules";

/**
 * The rule table, one describe per rule.
 *
 * Every rule gets both directions — the case that fires it and the case that does
 * not — because a check that can only be seen firing is a check nobody knows how
 * to satisfy. Where a rule has a threshold, the pair sits either side of it: the
 * bug these tests exist to catch is an off-by-one in a boundary, and a test using
 * 2 and 200 words would pass whatever the number in the middle was.
 */

const checkFor = (resume: Resume, id: string) => {
  const report = scoreResume(measureResume(resume), resume);
  const check = report.checks.find((candidate) => candidate.id === id);
  if (!check) throw new Error(`No rule with id "${id}"`);

  return check;
};

describe("quantified", () => {
  it("is skipped when there are no bullets to judge", () => {
    expect(checkFor(emptyResume(), "quantified").status).toBe("skipped");
  });

  it("passes at the one-in-three bar", () => {
    const resume = emptyResume({
      employmentHistory: [
        jobWith("Acme", "Cut p99 latency by 40%", "Rewrote the scheduler", "Wrote the runbook"),
        jobWith("Globex", "Shipped the billing rewrite to 3 regions"),
      ],
    });

    // 2 of 4 bullets carry a number.
    expect(checkFor(resume, "quantified").status).toBe("pass");
  });

  it("warns just under the bar", () => {
    const resume = emptyResume({
      employmentHistory: [
        jobWith("Acme", "Cut p99 latency by 40%", "Rewrote the scheduler", "Wrote the runbook"),
      ],
    });

    // 1 of 3 is 0.33 — under the 0.34 the rule asks for.
    expect(checkFor(resume, "quantified").status).toBe("warn");
  });

  it("fails, and names the offending lines, when no bullet carries a number", () => {
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "Rewrote the scheduler", "Wrote the runbook")],
    });
    const check = checkFor(resume, "quantified");

    expect(check.status).toBe("fail");
    expect(check.earned).toBe(0);
    expect(check.evidence).toContain("Rewrote the scheduler");
  });

  it("reads a Chinese quantity as a number", () => {
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "將建置時間縮短三倍", "重構排程器", "撰寫維運手冊")],
    });

    expect(checkFor(resume, "quantified").status).toBe("warn");
    expect(checkFor(resume, "quantified").evidence).not.toContain("將建置時間縮短三倍");
  });

  it("caps its evidence rather than listing every bullet", () => {
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "One line", "Two line", "Three line", "Four line")],
    });

    expect(checkFor(resume, "quantified").evidence).toHaveLength(3);
  });
});

describe("action-verbs", () => {
  it("is advisory: it reports without charging points", () => {
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "Responsible for the build pipeline")],
    });
    const check = checkFor(resume, "action-verbs");

    expect(check.advisory).toBe(true);
    expect(check.weight).toBe(0);
    // Never `fail` — a verdict this rule cannot defend should not be shouting.
    expect(check.status).toBe("warn");
  });

  it("passes an English bullet that opens with a verb from the list", () => {
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "Rebuilt the deployment pipeline")],
    });

    expect(checkFor(resume, "action-verbs").status).toBe("pass");
  });

  it("flags an English duty opener", () => {
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "Worked on the deployment pipeline")],
    });
    const check = checkFor(resume, "action-verbs");

    expect(check.status).toBe("warn");
    expect(check.detail).toContain("describe a duty");
  });

  it("passes a Chinese bullet that opens with a verb from the Chinese list", () => {
    const resume = emptyResume({ employmentHistory: [jobWith("Acme", "重構部署流程")] });

    expect(checkFor(resume, "action-verbs").status).toBe("pass");
  });

  it("reads 負責 as a duty even though it is also in the action list", () => {
    const resume = emptyResume({ employmentHistory: [jobWith("Acme", "負責部署流程")] });
    const check = checkFor(resume, "action-verbs");

    expect(check.status).toBe("warn");
    expect(check.detail).toContain("describe a duty");
  });

  it("judges each line by the script it is written in", () => {
    // English bullet opening with a verb, Chinese bullet opening with a verb:
    // neither may be judged against the other language's list.
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "Rebuilt the deployment pipeline", "重構部署流程")],
    });

    expect(checkFor(resume, "action-verbs").status).toBe("pass");
  });
});

describe("bullet-length", () => {
  it("is skipped when there are no bullets", () => {
    expect(checkFor(emptyResume(), "bullet-length").status).toBe("skipped");
  });

  it("passes a bullet of one line", () => {
    const resume = emptyResume({ employmentHistory: [jobWith("Acme", words(12))] });
    const check = checkFor(resume, "bullet-length");

    expect(check.status).toBe("pass");
    expect(check.earned).toBe(check.weight);
  });

  it("accepts the boundaries and rejects the words either side of them", () => {
    const inRange = emptyResume({ employmentHistory: [jobWith("Acme", words(4), words(30))] });
    expect(checkFor(inRange, "bullet-length").status).toBe("pass");

    const tooShort = emptyResume({ employmentHistory: [jobWith("Acme", words(3))] });
    expect(checkFor(tooShort, "bullet-length").detail).toContain("under 4 words");

    const tooLong = emptyResume({ employmentHistory: [jobWith("Acme", words(31))] });
    expect(checkFor(tooLong, "bullet-length").detail).toContain("past 30 words");
  });

  it("agrees with itself about singular and plural", () => {
    const one = emptyResume({ employmentHistory: [jobWith("Acme", words(31))] });
    expect(checkFor(one, "bullet-length").detail).toContain("1 bullet runs");

    const two = emptyResume({ employmentHistory: [jobWith("Acme", words(31), words(32))] });
    expect(checkFor(two, "bullet-length").detail).toContain("2 bullets run");
  });

  it("counts a Chinese line by its characters rather than by its spaces", () => {
    // 12 Han characters is around six words — a normal bullet, not a one-word one.
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "重構部署流程並縮短建置時間")],
    });

    expect(checkFor(resume, "bullet-length").status).toBe("pass");
  });
});

describe("bullets-per-entry", () => {
  it("is skipped when there are no entries", () => {
    expect(checkFor(emptyResume(), "bullets-per-entry").status).toBe("skipped");
  });

  it("passes when every entry has two bullets or more", () => {
    const resume = emptyResume({
      employmentHistory: [jobWith("Acme", "One line here", "Two lines here")],
    });
    const check = checkFor(resume, "bullets-per-entry");

    expect(check.status).toBe("pass");
    expect(check.earned).toBe(check.weight);
  });

  it("fails an entry with no bullets, and names it", () => {
    const resume = emptyResume({ employmentHistory: [jobWith("Acme")] });
    const check = checkFor(resume, "bullets-per-entry");

    expect(check.status).toBe("fail");
    expect(check.evidence).toContain("Acme");
  });

  it("warns — rather than fails — an entry with a single bullet", () => {
    const resume = emptyResume({ employmentHistory: [jobWith("Acme", "One line here")] });

    expect(checkFor(resume, "bullets-per-entry").status).toBe("warn");
  });

  it("labels an unnamed entry rather than showing a blank", () => {
    const resume = emptyResume({ employmentHistory: [jobWith("")] });

    expect(checkFor(resume, "bullets-per-entry").evidence).toContain("Untitled entry");
  });

  it("does not judge a hidden section's entries", () => {
    const resume = emptyResume({
      projects: [projectWith("Side thing", "")],
      visibility: { ...emptyResume().visibility, projects: false },
    });

    expect(checkFor(resume, "bullets-per-entry").status).toBe("skipped");
  });
});

describe("profile", () => {
  it("is skipped when the section is hidden", () => {
    const resume = emptyResume({
      profile: "",
      visibility: { ...emptyResume().visibility, profile: false },
    });

    expect(checkFor(resume, "profile").status).toBe("skipped");
  });

  it("fails an empty profile", () => {
    expect(checkFor(emptyResume(), "profile").status).toBe("fail");
  });

  it("warns under 25 words and passes at 25", () => {
    expect(checkFor(emptyResume({ profile: words(24) }), "profile").status).toBe("warn");
    expect(checkFor(emptyResume({ profile: words(25) }), "profile").status).toBe("pass");
  });

  it("passes at 120 words and warns past it", () => {
    expect(checkFor(emptyResume({ profile: words(120) }), "profile").status).toBe("pass");
    expect(checkFor(emptyResume({ profile: words(121) }), "profile").status).toBe("warn");
  });

  it("counts every paragraph of a multi-paragraph profile", () => {
    const resume = emptyResume({ profile: `${words(20)}\n\n${words(20)}` });

    expect(checkFor(resume, "profile").status).toBe("pass");
  });
});

describe("length", () => {
  /* The rule reads the whole document, so these drive it through the profile —
     the one field that is prose and nothing else's business. */
  const withWords = (count: number) => emptyResume({ profile: words(count) });

  it("fails a document well under a page", () => {
    expect(checkFor(withWords(149), "length").status).toBe("fail");
  });

  it("warns between 150 and 250 words", () => {
    expect(checkFor(withWords(150), "length").status).toBe("warn");
    expect(checkFor(withWords(249), "length").status).toBe("warn");
  });

  it("passes from 250 to 1000 words", () => {
    expect(checkFor(withWords(250), "length").status).toBe("pass");
    expect(checkFor(withWords(1000), "length").status).toBe("pass");
  });

  it("warns past two pages", () => {
    expect(checkFor(withWords(1001), "length").status).toBe("warn");
  });
});

describe("contact", () => {
  const complete = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "0900000000",
    city: "Taipei",
  };

  it("passes with all four fields", () => {
    const check = checkFor(emptyResume(complete), "contact");

    expect(check.status).toBe("pass");
    expect(check.earned).toBe(check.weight);
  });

  it("fails when a field a recruiter cannot proceed without is missing", () => {
    const check = checkFor(emptyResume({ ...complete, email: "" }), "contact");

    expect(check.status).toBe("fail");
    expect(check.evidence).toEqual(["Email"]);
  });

  it("only warns when the missing fields are the cheaper two", () => {
    const check = checkFor(emptyResume({ ...complete, phone: "", city: "" }), "contact");

    expect(check.status).toBe("warn");
    // Name and email are worth more than the other two put together.
    expect(check.earned).toBe(8);
  });

  it("reads a field of spaces as missing", () => {
    expect(checkFor(emptyResume({ ...complete, name: "   " }), "contact").status).toBe("fail");
  });
});

describe("email-format", () => {
  it("is skipped when there is no email to judge", () => {
    expect(checkFor(emptyResume(), "email-format").status).toBe("skipped");
  });

  it("passes an ordinary address", () => {
    expect(checkFor(emptyResume({ email: "ada@example.com" }), "email-format").status).toBe("pass");
  });

  it("catches the typos a writer would want caught", () => {
    expect(checkFor(emptyResume({ email: "ada.example.com" }), "email-format").status).toBe("fail");
    expect(checkFor(emptyResume({ email: "ada@example" }), "email-format").status).toBe("fail");
    expect(checkFor(emptyResume({ email: "ada @example.com" }), "email-format").status).toBe(
      "fail",
    );
  });

  it("quotes the address it is objecting to", () => {
    expect(checkFor(emptyResume({ email: "ada.example.com" }), "email-format").detail).toContain(
      "ada.example.com",
    );
  });
});

describe("wanted-job", () => {
  it("passes when a target title is set", () => {
    expect(
      checkFor(emptyResume({ wantedJob: "Staff Frontend Engineer" }), "wanted-job").status,
    ).toBe("pass");
  });

  it("warns when it is empty", () => {
    expect(checkFor(emptyResume({ wantedJob: "  " }), "wanted-job").status).toBe("warn");
  });
});

describe("skills", () => {
  const skillList = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ name: `Skill ${index}` }));

  it("is skipped when the section is hidden", () => {
    const resume = emptyResume({
      skills: skillList(0),
      visibility: { ...emptyResume().visibility, skills: false },
    });

    expect(checkFor(resume, "skills").status).toBe("skipped");
  });

  it("fails with none listed", () => {
    expect(checkFor(emptyResume(), "skills").status).toBe("fail");
  });

  it("warns under five and passes at five", () => {
    expect(checkFor(emptyResume({ skills: skillList(4) }), "skills").status).toBe("warn");
    expect(checkFor(emptyResume({ skills: skillList(5) }), "skills").status).toBe("pass");
  });

  it("passes at 25 and warns past it", () => {
    expect(checkFor(emptyResume({ skills: skillList(25) }), "skills").status).toBe("pass");
    expect(checkFor(emptyResume({ skills: skillList(26) }), "skills").status).toBe("warn");
  });

  it("does not count a blank skill row", () => {
    const resume = emptyResume({ skills: [...skillList(4), { name: "   " }] });

    expect(checkFor(resume, "skills").status).toBe("warn");
  });
});

describe("education", () => {
  const school = { school: "NTU", degree: "BSc", major: "CS", timeline: { from: null, to: null } };

  it("is skipped when the section is hidden", () => {
    const resume = emptyResume({
      visibility: { ...emptyResume().visibility, educations: false },
    });

    expect(checkFor(resume, "education").status).toBe("skipped");
  });

  it("passes with one entry", () => {
    expect(checkFor(emptyResume({ educations: [school] }), "education").status).toBe("pass");
  });

  it("warns with none", () => {
    expect(checkFor(emptyResume(), "education").status).toBe("warn");
  });

  it("does not count an entry with no school name", () => {
    const resume = emptyResume({ educations: [{ ...school, school: "  " }] });

    expect(checkFor(resume, "education").status).toBe("warn");
  });
});

describe("links", () => {
  it("is skipped only when neither Links nor Projects is on the page", () => {
    const resume = emptyResume({
      visibility: { ...emptyResume().visibility, socialLinks: false, projects: false },
    });

    expect(checkFor(resume, "links").status).toBe("skipped");
  });

  it("passes on a social link", () => {
    const resume = emptyResume({
      socialLinks: [{ name: "GitHub", url: "https://github.com/ada" }],
    });

    expect(checkFor(resume, "links").status).toBe("pass");
  });

  it("passes on a project url, with Links hidden", () => {
    const resume = emptyResume({
      projects: [projectWith("Side thing", "https://example.com", "Built a thing")],
      visibility: { ...emptyResume().visibility, socialLinks: false },
    });

    expect(checkFor(resume, "links").status).toBe("pass");
  });

  it("survives a project that arrived without a url field at all", () => {
    const resume = emptyResume({
      projects: [{ name: "Side thing", description: "Built a thing" } as never],
    });

    expect(() => checkFor(resume, "links")).not.toThrow();
    expect(checkFor(resume, "links").status).toBe("warn");
  });

  it("warns when there is no link anywhere", () => {
    expect(checkFor(emptyResume(), "links").status).toBe("warn");
  });
});

describe("scoreResume", () => {
  const filled = emptyResume({
    name: "Ada Lovelace",
    wantedJob: "Staff Engineer",
    city: "Taipei",
    phone: "0900000000",
    email: "ada@example.com",
    profile: words(60),
    skills: Array.from({ length: 8 }, (_, index) => ({ name: `Skill ${index}` })),
    educations: [{ school: "NTU", degree: "BSc", major: "CS", timeline: { from: null, to: null } }],
    socialLinks: [{ name: "GitHub", url: "https://github.com/ada" }],
    employmentHistory: [
      /* Three roles of three bullets: enough to clear the "well under a page"
         rule, and four of the nine lines carry a number, which clears the
         one-in-three the quantified rule asks for. */
      jobWith(
        "Acme",
        `Cut build time by 40% ${words(14)}`,
        `Rebuilt the scheduler ${words(15)}`,
        `Shipped 3 releases a week ${words(13)}`,
      ),
      jobWith(
        "Globex",
        `Led a team of 6 engineers ${words(13)}`,
        `Designed the billing rewrite ${words(14)}`,
        `Documented the migration ${words(15)}`,
      ),
      jobWith(
        "Initech",
        `Automated 90% of the release checks ${words(12)}`,
        `Established the on-call rotation ${words(14)}`,
        `Migrated the fleet to Kubernetes ${words(13)}`,
      ),
    ],
  });

  it("scores a complete resume out of 100", () => {
    const report = scoreResume(measureResume(filled), filled);

    expect(report.score).toBe(100);
    expect(report.issues).toHaveLength(0);
  });

  it("rescales over the rules that applied, so hiding a section costs nothing", () => {
    const hidden = {
      ...filled,
      visibility: { ...filled.visibility, projects: false, educations: false },
    };
    const report = scoreResume(measureResume(hidden), hidden);

    expect(report.score).toBe(100);
    expect(report.checks.some((check) => check.status === "skipped")).toBe(true);
  });

  it("leaves the advisory rule out of the total", () => {
    /* The same document with its first role reworded to open on duties — the
       numbers, and so every other rule's verdict, are left where they were. */
    const advisoryOnly = {
      ...filled,
      employmentHistory: [
        jobWith(
          "Acme",
          `Responsible for cutting build time by 40% ${words(12)}`,
          `Worked on rebuilding the scheduler ${words(14)}`,
          `Involved in shipping 3 releases a week ${words(12)}`,
        ),
        ...filled.employmentHistory.slice(1),
      ],
    };
    const report = scoreResume(measureResume(advisoryOnly), advisoryOnly);
    const advisory = report.checks.find((check) => check.id === "action-verbs");

    expect(advisory?.status).toBe("warn");
    // Warned about, but the number is unmoved: weight 0 is out of both sums.
    expect(report.score).toBe(100);
  });

  it("never reports a score outside 0–100", () => {
    const empty = scoreResume(measureResume(emptyResume()), emptyResume());

    expect(empty.score).toBeGreaterThanOrEqual(0);
    expect(empty.score).toBeLessThanOrEqual(100);
  });

  it("puts failures before warnings, and advisory findings last", () => {
    const report = scoreResume(measureResume(emptyResume()), emptyResume());
    const advisoryIndex = report.issues.findIndex((issue) => issue.advisory);
    const lastFailure = report.issues.map((issue) => issue.status).lastIndexOf("fail");
    const firstWarning = report.issues.findIndex((issue) => issue.status === "warn");

    expect(lastFailure).toBeLessThan(firstWarning);
    if (advisoryIndex !== -1) expect(advisoryIndex).toBe(report.issues.length - 1);
  });

  it("advertises a gain the total actually moves by", () => {
    const missingTitle = { ...filled, wantedJob: "" };
    const before = scoreResume(measureResume(missingTitle), missingTitle);
    const check = before.checks.find((candidate) => candidate.id === "wanted-job");
    const gain = potentialGain(check!, before.applicableWeight);

    const after = scoreResume(measureResume(filled), filled);

    expect(after.score - before.score).toBe(gain);
  });
});
