"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Where the editor is, when the page cannot ask the browser.
 *
 * Only used for the server-rendered pass and for anything that reads the HTML
 * without running it. A visitor's browser replaces it with their own origin below.
 */
const CANONICAL_ORIGIN = "https://simple-resume-nu.vercel.app";

/** The token `prompt` uses to stand in for the site's own origin. */
const ORIGIN_TOKEN = "{{origin}}";

/**
 * A prompt the visitor is meant to run, not just read, so the copy button is the
 * point rather than a convenience — retyping a twelve-line prompt by hand is the
 * difference between trying this and not.
 *
 * The prompt is passed as a string rather than as children: it has to reach the
 * clipboard verbatim, and JSX children would arrive as a React tree that has to
 * be flattened back into text.
 *
 * It names the editor's URL, and that URL has to be the one the reader is looking
 * at — this prompt used to say `localhost:3000`, which is the address of the
 * machine it was written on and of nothing a visitor has running. So the caller
 * writes `{{origin}}` and this resolves it against the live page, which keeps the
 * copied text correct on the deployed site, on a preview deployment, and in
 * development without any of the three being special-cased.
 */
const CopyablePrompt = ({ label, prompt }: { label: string; prompt: string }) => {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState(CANONICAL_ORIGIN);

  // Deliberately after mount rather than during render: `location` does not exist
  // on the server, and reading it inline would make the first client render
  // disagree with the HTML it is hydrating.
  useEffect(() => setOrigin(window.location.origin), []);

  const resolved = prompt.replaceAll(ORIGIN_TOKEN, origin);

  // A confirmation that never resets reads as a permanent state change rather
  // than as an acknowledgement.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resolved);
      setCopied(true);
    } catch {
      // A denied clipboard permission is not worth an error state — the text is
      // on screen and selectable either way.
    }
  };

  return (
    <figure className="m-0 overflow-hidden rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--graphite-fixed)] shadow-[var(--shadow-md)]">
      <figcaption className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-white/55">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-white/70 transition-colors duration-200 hover:border-white/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
        >
          {copied ? (
            <Check aria-hidden className="size-3 text-[var(--g1)]" />
          ) : (
            <Copy aria-hidden className="size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </figcaption>

      <pre className="overflow-x-auto px-5 py-5 font-mono text-[0.8rem] leading-[1.75] text-white/90">
        {resolved}
      </pre>
    </figure>
  );
};

export default CopyablePrompt;
