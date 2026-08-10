"use client";

import { useEffect, useState } from "react";

import { decodeSharePayload, SharePayload } from "@/lib/share-link";
import { getTemplate } from "@/app/resume-editor/components/template/registry";

/**
 * The read-only end of a share link.
 *
 * Deliberately not a route with a parameter: the payload is in the fragment, and
 * the fragment is the one part of a URL a browser keeps to itself. Next never
 * sees it, so this page has to be a client component that reads
 * `window.location.hash` after mount — which is also why there is a loading
 * state at all for a page with no network calls.
 *
 * The resume is drawn with the template's own `buildHtml`, the same self-contained
 * document the HTML export produces, dropped into a sandboxed iframe. That reuses
 * the one renderer that is already designed to stand alone, and the sandbox means
 * a hand-crafted payload has no reach into this page.
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
  const html = getTemplate(templateId).buildHtml({ resume, backgroundColor });

  return (
    <main className="min-h-dvh bg-muted/40 py-8">
      <div className="mx-auto w-full max-w-[860px] px-4">
        <iframe
          // No allow-scripts: the payload came from a URL a stranger can write,
          // and the exported document is static markup that needs none.
          sandbox=""
          title={`${resume.name || "Shared"} — resume`}
          srcDoc={html}
          className="h-[1123px] w-full rounded-sm border-0 bg-white shadow-[0_18px_50px_-20px_rgba(23,21,15,0.45)]"
        />
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
