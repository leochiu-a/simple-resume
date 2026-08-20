import { describe, expect, it } from "vitest";

import { emptyResume, jobWith } from "@/test/resume-fixture";

import {
  buildShareUrl,
  decodeShareInput,
  decodeSharePayload,
  encodeSharePayload,
} from "./share-link";

/**
 * The share link is the only way a resume leaves this browser, and both of its
 * failure directions are silent: an encoder that drops a field sends someone a
 * resume with a section missing, and a decoder that trusts what it is given
 * renders a stranger's JSON. So both directions are pinned here — the round trip
 * for the first, and a set of payloads that must be refused for the second.
 */

const payload = {
  resume: emptyResume({
    name: "Ada Lovelace",
    wantedJob: "Staff Engineer",
    email: "ada@example.com",
    profile: "Analytical engine, mostly.",
    employmentHistory: [jobWith("Acme", "Cut build time by 40%")],
    sectionOrder: [
      "employmentHistory",
      "profile",
      "skills",
      "educations",
      "projects",
      "socialLinks",
    ],
    visibility: {
      profile: true,
      employmentHistory: true,
      projects: false,
      educations: true,
      skills: true,
      socialLinks: false,
    },
  }),
  templateId: "timeline",
  backgroundColor: "#123456",
};

/**
 * A fragment built the way the encoder builds one, so a test can hand the decoder
 * an envelope the encoder would never produce — a future version number, a resume
 * that is not one. Deliberately a second implementation: routing hostile input
 * through the function under test would only prove it agrees with itself.
 */
const encodeEnvelope = async (envelope: unknown) => {
  const stream = new Blob([JSON.stringify(envelope)]).stream();
  const packed = new Uint8Array(
    await new Response(stream.pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer(),
  );

  let binary = "";
  for (const byte of packed) binary += String.fromCharCode(byte);

  return `r=${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
};

describe("round trip", () => {
  it("returns the resume, the template and the colour unchanged", async () => {
    const decoded = await decodeSharePayload(await encodeSharePayload(payload));

    expect(decoded).toEqual(payload);
  });

  it("carries the section order and the hidden sections", async () => {
    const decoded = await decodeSharePayload(await encodeSharePayload(payload));

    expect(decoded?.resume.sectionOrder).toEqual(payload.resume.sectionOrder);
    expect(decoded?.resume.visibility.projects).toBe(false);
  });

  it("survives non-Latin text", async () => {
    const chinese = {
      ...payload,
      resume: emptyResume({ name: "王小明", profile: "十年前端經驗，專注於效能與可及性。" }),
    };
    const decoded = await decodeSharePayload(await encodeSharePayload(chinese));

    expect(decoded?.resume.name).toBe("王小明");
    expect(decoded?.resume.profile).toBe(chinese.resume.profile);
  });

  it("produces a fragment that is safe in a URL as it stands", async () => {
    const fragment = await encodeSharePayload(payload);

    expect(fragment.startsWith("r=")).toBe(true);
    // base64url: no +, / or = to be escaped, and nothing that ends a fragment.
    expect(fragment.slice(2)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("builds an absolute URL that decodes back", async () => {
    const url = await buildShareUrl("https://open-resume.example", payload);

    expect(url.startsWith("https://open-resume.example/r#r=")).toBe(true);
    expect(await decodeShareInput(url)).toEqual(payload);
  });

  it("compresses rather than merely encoding — a repetitive resume stays short", async () => {
    const long = {
      ...payload,
      resume: emptyResume({
        name: "Ada Lovelace",
        profile: "Analytical engine, mostly. ".repeat(200),
      }),
    };
    const fragment = await encodeSharePayload(long);

    expect(fragment.length).toBeLessThan(long.resume.profile.length / 2);
  });
});

describe("payloads that must be refused", () => {
  it("refuses a version it does not recognise", async () => {
    const fragment = await encodeEnvelope({ v: 2, ...payload });

    expect(await decodeSharePayload(fragment)).toBeNull();
  });

  it("refuses an envelope with no version at all", async () => {
    const fragment = await encodeEnvelope(payload);

    expect(await decodeSharePayload(fragment)).toBeNull();
  });

  it("refuses a payload whose resume is not shaped like one", async () => {
    expect(
      await decodeSharePayload(await encodeEnvelope({ v: 1, ...payload, resume: null })),
    ).toBeNull();
    expect(
      await decodeSharePayload(await encodeEnvelope({ v: 1, ...payload, resume: {} })),
    ).toBeNull();
    expect(
      await decodeSharePayload(await encodeEnvelope({ v: 1, ...payload, resume: { name: 42 } })),
    ).toBeNull();
  });

  it("refuses a payload with no template or colour to draw it with", async () => {
    expect(
      await decodeSharePayload(await encodeEnvelope({ v: 1, ...payload, templateId: 7 })),
    ).toBeNull();
    expect(
      await decodeSharePayload(await encodeEnvelope({ v: 1, ...payload, backgroundColor: null })),
    ).toBeNull();
  });

  it("returns null rather than throwing on a link a chat client truncated", async () => {
    const fragment = await encodeSharePayload(payload);
    const truncated = fragment.slice(0, Math.floor(fragment.length * 0.6));

    await expect(decodeSharePayload(truncated)).resolves.toBeNull();
  });

  it("returns null rather than throwing on a fragment that is not base64 at all", async () => {
    await expect(decodeSharePayload("r=not a payload!!")).resolves.toBeNull();
  });

  it("returns null on a fragment carrying some other parameter", async () => {
    expect(await decodeSharePayload("#template=classic")).toBeNull();
    expect(await decodeSharePayload("")).toBeNull();
  });
});

describe("what someone actually pastes", () => {
  const paste = async (input: string) => decodeShareInput(input);

  it("accepts a whole URL", async () => {
    const url = await buildShareUrl("https://open-resume.example", payload);

    expect(await paste(url)).toEqual(payload);
  });

  it("accepts the bare fragment someone grabbed the tail of", async () => {
    const fragment = await encodeSharePayload(payload);

    expect(await paste(`#${fragment}`)).toEqual(payload);
    expect(await paste(fragment)).toEqual(payload);
  });

  it("accepts a link a mail client wrapped or padded", async () => {
    const url = await buildShareUrl("https://open-resume.example", payload);

    expect(await paste(`  ${url}  `)).toEqual(payload);
    expect(await paste(`<${url}>`)).toEqual(payload);
  });

  it("accepts a link from another deployment, since the payload is self-contained", async () => {
    const url = await buildShareUrl("https://someone-elses-fork.example", payload);

    expect(await paste(url)).toEqual(payload);
  });

  it("returns null on an empty paste", async () => {
    expect(await paste("   ")).toBeNull();
  });

  it("returns null on a URL with no fragment", async () => {
    expect(await paste("https://open-resume.example/r")).toBeNull();
  });
});
