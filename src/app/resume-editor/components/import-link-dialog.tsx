"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { decodeShareInput } from "@/lib/share-link";
import { Resume } from "@/types/resume";

/**
 * Reads a resume back out of a share link.
 *
 * The link already carries the whole resume, so importing is decoding rather than
 * fetching — which is why this asks for the URL itself instead of offering to open
 * one. Nothing is requested from the network, and a link from another deployment
 * of this app works here unchanged.
 *
 * It is a dialog and not a one-click menu item because importing *replaces* the
 * resume on screen. That is the one destructive thing the editor can do to work
 * the user has typed, so it names what will be overwritten and waits to be told to
 * go ahead. The preview of the incoming resume is what makes that confirmation
 * meaningful: "Import" on its own asks the user to trust a URL they cannot read.
 */
const ImportLinkDialog = ({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Replaces the active locale. The dialog closes itself afterwards. */
  onImport: (resume: Resume) => void;
}) => {
  const [input, setInput] = useState("");
  const [resume, setResume] = useState<Resume | null>(null);
  const [checking, setChecking] = useState(false);

  // Nothing is kept between openings: a stale link in the box, or worse a stale
  // preview of someone else's resume, is not something to reopen onto.
  useEffect(() => {
    if (!open) {
      setInput("");
      setResume(null);
      setChecking(false);
    }
  }, [open]);

  /*
    Decoded as you paste rather than behind a "check" button. Decoding is local and
    takes a millisecond, so there is no reason to make the user ask — and the
    preview appearing the moment the link lands is what tells them the link is
    good, which is the question they actually have.
  */
  useEffect(() => {
    if (!input.trim()) {
      setResume(null);
      setChecking(false);

      return;
    }

    let cancelled = false;
    setChecking(true);

    decodeShareInput(input)
      .then((payload) => {
        if (cancelled) return;
        setResume(payload?.resume ?? null);
        setChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        setResume(null);
        setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [input]);

  const showError = !!input.trim() && !checking && !resume;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from a share link</DialogTitle>
          <DialogDescription>
            Paste a resume share link. The resume travels inside the link itself, so nothing is
            downloaded — and this replaces the resume you are editing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="share-link-input" className="text-sm font-medium">
            Share link
          </label>
          <Textarea
            id="share-link-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://…/r#r=…"
            rows={4}
            // Long, opaque, and never meant to be read: proportional type and
            // spellcheck both fight a base64 payload.
            className="break-all font-mono text-xs"
            spellCheck={false}
            aria-describedby="share-link-status"
          />

          {/* One live region for every outcome, so a screen reader hears the
              verdict change rather than only sighted users seeing it. */}
          <p
            id="share-link-status"
            aria-live="polite"
            className={showError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {checking && "Reading the link…"}
            {showError &&
              "This does not look like a share link. It may have been truncated by a chat app — check the whole link was copied, including everything after the #."}
            {!checking && !showError && resume && (
              <>
                Found <strong>{resume.name || "an unnamed resume"}</strong>
                {resume.wantedJob ? ` — ${resume.wantedJob}` : ""}
                {". "}
                {resume.employmentHistory.length > 0 &&
                  `${resume.employmentHistory.length} job${resume.employmentHistory.length > 1 ? "s" : ""}, `}
                {`${resume.skills.length} skill${resume.skills.length === 1 ? "" : "s"}.`}
              </>
            )}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            // Disabled until there is something real to import, so the button
            // cannot promise an action it would have to fail at.
            disabled={!resume}
            onClick={() => {
              if (!resume) return;
              onImport(resume);
              onOpenChange(false);
            }}
          >
            Replace my resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportLinkDialog;
