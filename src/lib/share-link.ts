import { Resume } from "@/types/resume";
import { ResumeDoc } from "@/types/resume-doc";

/**
 * Encoding a resume into a URL, and reading one back out.
 *
 * The whole point of this app is that the resume never leaves the browser, and a
 * share link must not be the thing that breaks that promise. So the resume travels
 * *in* the URL rather than in a database behind one: the payload lives in the
 * fragment, which browsers never put on the wire, so even the host serving the
 * page cannot see it. No account, no row, nothing to leak or delete later.
 *
 * That buys privacy at the cost of a length budget, which is what `compress`
 * below is for.
 */

/** What a share link carries: the document plus how it should be drawn. */
export interface SharePayload {
  /** Only ever one locale — the one being shared. Keeps the URL half the size. */
  resume: Resume;
  templateId: string;
  backgroundColor: string;
}

/**
 * Bumped whenever the payload shape changes in a way an older reader would get
 * wrong. Links already in the wild keep their old number and a reader that does
 * not recognise it refuses rather than rendering a half-understood resume.
 */
const SHARE_VERSION = 1;

interface EnvelopeV1 extends SharePayload {
  v: 1;
}

/** `deflate-raw` over gzip: same deflate stream without the 18-byte header. */
const FORMAT = "deflate-raw";

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  return bytes;
};

const collect = async (stream: ReadableStream<Uint8Array>) => {
  const buffer = await new Response(stream).arrayBuffer();

  return new Uint8Array(buffer);
};

const compress = async (text: string) => {
  const input = new Blob([text]).stream();

  return collect(input.pipeThrough(new CompressionStream(FORMAT)));
};

const decompress = async (bytes: Uint8Array) => {
  const input = new Blob([bytes as BlobPart]).stream();
  const out = await collect(input.pipeThrough(new DecompressionStream(FORMAT)));

  return new TextDecoder().decode(out);
};

/**
 * The fragment for a share link — `#r=<payload>`, without the leading `#`.
 *
 * Only the active locale goes in. A resume is read in one language at a time, and
 * carrying the translation as well would nearly double the URL for something the
 * reader never sees.
 */
export const encodeSharePayload = async (payload: SharePayload): Promise<string> => {
  const envelope: EnvelopeV1 = { v: SHARE_VERSION, ...payload };
  const packed = await compress(JSON.stringify(envelope));

  return `r=${toBase64Url(packed)}`;
};

/** Absolute URL, so the result is something that can go straight on a clipboard. */
export const buildShareUrl = async (origin: string, payload: SharePayload): Promise<string> =>
  `${origin}/r#${await encodeSharePayload(payload)}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Reads a payload back out of a fragment, or returns null.
 *
 * Everything here is attacker-controlled — a share link is a URL a stranger sends
 * you — so a payload that is not shaped like a resume is refused outright rather
 * than handed to a template to trip over. The templates already escape what they
 * render, so the risk is a crash rather than script, but a blank page with an
 * explanation beats a broken one.
 */
export const decodeSharePayload = async (hash: string): Promise<SharePayload | null> => {
  const encoded = new URLSearchParams(hash.replace(/^#/, "")).get("r");
  if (!encoded) return null;

  try {
    const parsed: unknown = JSON.parse(await decompress(fromBase64Url(encoded)));

    if (!isRecord(parsed) || parsed.v !== SHARE_VERSION) return null;

    const { resume, templateId, backgroundColor } = parsed;
    if (!isRecord(resume) || typeof resume.name !== "string") return null;
    if (typeof templateId !== "string" || typeof backgroundColor !== "string") return null;

    return { resume: resume as unknown as Resume, templateId, backgroundColor };
  } catch {
    // Truncated by a chat client, hand-edited, or written by an older version.
    return null;
  }
};

/** The locale a share link should carry: the one on screen. */
export const activeResume = (doc: ResumeDoc): Resume | undefined => doc.locales[doc.activeLang];
