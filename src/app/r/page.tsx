"use client";

import { useEffect, useState } from "react";

import { decodeSharePayload, SharePayload } from "@/lib/share-link";
import { getTemplate } from "@/app/resume-editor/components/template/registry";
import ResumeSheetsCSR from "@/app/resume-editor/components/template/resume-sheets";

/**
 * The read-only end of a share link.
 *
 * Deliberately not a route with a parameter: the payload is in the fragment, and
 * the fragment is the one part of a URL a browser keeps to itself. Next never
 * sees it, so this page has to be a client component that reads
 * `window.location.hash` after mount — which is also why there is a loading
 * state at all for a page with no network calls.
 *
 * The sheets are the editor's own rendering — `ResumeSheets` around
 * `template.render(...)` — not a second renderer built for this page. It scales A4
 * to the space it is given and paginates with the same rules the PDF uses, so a
 * shared resume breaks across pages exactly where the downloaded PDF does. What
 * differs from the editor is the arrangement: every page is laid out down the
 * screen rather than reached through a pager, because a reader scrolls a document
 * they were sent instead of hunting for the button that admits there is a page two.
 * The alternative, dropping the HTML export into an iframe, has no pages at all:
 * that document is one continuous column that only becomes sheets under
 * `@media print`.
 */

type State =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "ready"; payload: SharePayload };

const SharedResumePage = () => {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // Generation counter rather than a per-run boolean: decoding is async, and
    // two hash changes in quick succession would otherwise race to call setState
    // — the slower decode winning and showing the wrong resume.
    let current = 0;

    const read = () => {
      const generation = (current += 1);
      const { hash } = window.location;

      if (!hash || hash === "#") {
        setState({ status: "empty" });

        return;
      }

      setState({ status: "loading" });
      decodeSharePayload(hash)
        .then((payload) => {
          if (generation !== current) return;
          setState(payload ? { status: "ready", payload } : { status: "invalid" });
        })
        .catch(() => {
          if (generation === current) setState({ status: "invalid" });
        });
    };

    read();

    /*
      Changing only the fragment is a same-document navigation: nothing remounts,
      so without this the page would keep showing the resume from the previous
      link. That is not a hypothetical — the payload *is* the fragment here, so
      "open a different resume" and "change the hash" are the same act, and it is
      what happens when someone pastes a second link into the same tab or steps
      back through history.
    */
    window.addEventListener("hashchange", read);

    return () => {
      // Also stops any decode still in flight from landing after unmount.
      current += 1;
      window.removeEventListener("hashchange", read);
    };
  }, []);

  if (state.status === "loading") {
    return <Centered>Loading resume…</Centered>;
  }

  if (state.status === "empty") {
    return (
      <Centered>
        This link has no resume in it. Ask whoever sent it for the full link — the part after the{" "}
        <code className="font-mono">#</code> is the resume, and some apps cut it off.
      </Centered>
    );
  }

  if (state.status === "invalid") {
    return (
      <Centered>
        This link could not be read. It may have been shortened, truncated by a chat app, or written
        by a newer version of the editor.
      </Centered>
    );
  }

  const { resume, templateId, backgroundColor } = state.payload;

  return (
    /*
      The same wash the editor's preview pane uses, so the sheets read as paper on a
      desk rather than white on white.

      The padding is on top of the stack's own `py-6`. Inside the editor that 24px
      is enough because the preview sits in a pane with a header above it; here the
      sheets are the only thing on the page, and since the crop marks are drawn
      *outside* the trim, 24px alone put the top mark almost on the viewport edge —
      which reads as a sheet clipped by the window rather than one placed on a desk.
    */
    <main className="min-h-dvh bg-muted/40 py-4 sm:py-8">
      {/* `px-6` is CROP_MARK_GUTTER: the sheets draw crop marks outside the trim,
          and this box clips. A sheet sizes itself to whatever room it is given,
          so the width cap is what keeps it from growing past 1:1 on a wide screen. */}
      <div className="mx-auto w-full max-w-[860px] px-6">
        <ResumeSheetsCSR>
          {getTemplate(templateId).render({ resume, backgroundColor })}
        </ResumeSheetsCSR>
      </div>
    </main>
  );
};

const Centered = ({ children }: { children: React.ReactNode }) => (
  <main className="grid min-h-dvh place-items-center p-6">
    <p className="max-w-md text-center text-sm text-muted-foreground">{children}</p>
  </main>
);

export default SharedResumePage;
