import { FC, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LANG_LABEL } from "@/lib/resume-doc";
import { ResumeLang } from "@/types/resume-doc";
import { UseResumeTranslationResult } from "../hooks/useResumeTranslation";

interface TranslationPanelProps {
  primaryLang: ResumeLang;
  secondaryLang: ResumeLang;
  /** False while the translated locale is still an empty slot. */
  hasLocale: boolean;
  translation: UseResumeTranslationResult;
  onMakePrimary: () => void;
  /** Drops this locale and returns to the original. Also the way out of an empty slot. */
  onRemove: () => void;
}

const Progress = ({ translation }: { translation: UseResumeTranslationResult }) => {
  const { progress, translator } = translation;
  const downloading = translator.state === "downloading";

  return (
    <div className="mt-4">
      <ProgressBar
        value={downloading ? translator.progress : progress ? progress.done / progress.total : null}
        label={downloading ? "Model download" : "Translation"}
      />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {downloading
          ? translator.progress === null
            ? "Downloading model"
            : `Downloading model · ${Math.round(translator.progress * 100)}%`
          : progress
            ? `Translating · ${progress.done} / ${progress.total}`
            : "Starting"}
      </p>
    </div>
  );
};

/**
 * Everything the translated locale needs to say about itself, in one place at
 * the top of the form: that it is a translation, that editing it is safe, and
 * what to do when the original has moved on underneath it.
 */
const TranslationPanel: FC<TranslationPanelProps> = ({
  primaryLang,
  secondaryLang,
  hasLocale,
  translation,
  onMakePrimary,
  onRemove,
}) => {
  const { translator, running, staleCount, editedCount, error, run, retranslate } = translation;
  const unsupported = translator.state === "unsupported";
  const busy = running || translator.state === "downloading";
  /* One question at a time. Two booleans let both prompts stand at once — two
     destructive buttons and two `Cancel`s in the same wrapping row — because
     nothing made opening one close the other. A single value cannot hold both. */
  const [confirming, setConfirming] = useState<"redo" | "remove" | null>(null);

  if (!hasLocale) {
    return (
      <section className="mb-10 border p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {LANG_LABEL[secondaryLang]}
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.01em]">
          No {LANG_LABEL[secondaryLang]} version yet
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Translate your {LANG_LABEL[primaryLang]} resume with the translator built into your
          browser. It runs on this device — the resume is not uploaded anywhere. Afterwards you can
          correct the wording here without touching the {LANG_LABEL[primaryLang]} original.
        </p>

        {busy ? (
          <Progress translation={translation} />
        ) : (
          <>
            <Button
              type="button"
              className="mt-4"
              disabled={unsupported}
              onClick={() => void run()}
            >
              Translate from {LANG_LABEL[primaryLang]}
            </Button>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              {unsupported
                ? `${translator.error ?? "On-device translation needs Chrome 138+ or Edge 148+ on desktop."} You can still write this version by hand.`
                : translator.state === "downloadable"
                  ? "The model is downloaded the first time you do this, and kept for later."
                  : "The model is already on this device."}
            </p>
          </>
        )}

        {/* The slot is empty because it was just asked for, and asking for it is
            the only way to be here. Somewhere to say "never mind" is the other
            half of making the second language optional — without it the offer is
            a trapdoor, and the way back is a tab you have to guess at. */}
        {!busy && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-4 block text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Never mind, stay in {LANG_LABEL[primaryLang]} only
          </button>
        )}

        {error && <p className="mt-3 text-[11px] text-destructive">{error}</p>}
      </section>
    );
  }

  return (
    <section className="mb-8 border-l-2 border-foreground/20 pl-4">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        This is a translation of your {LANG_LABEL[primaryLang]} resume. Edits here stay here — they
        never change the {LANG_LABEL[primaryLang]} original.
      </p>

      {busy ? (
        <Progress translation={translation} />
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Updating keeps anything rewritten by hand exactly as it is; only
              the untouched fields take the new translation. */}
          {staleCount > 0 && (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {staleCount} {staleCount === 1 ? "field has" : "fields have"} changed in the
                original
              </span>
              <Button type="button" size="sm" disabled={unsupported} onClick={() => void run()}>
                Update translation
              </Button>
            </>
          )}

          {/* Distinct from "Update translation": that one protects your
              rewrites, this one throws them away. Hence the confirm step. */}
          {confirming === "redo" ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[11px] text-muted-foreground">
                {editedCount > 0
                  ? `Translate all over again? ${editedCount} ${
                      editedCount === 1 ? "field you rewrote" : "fields you rewrote"
                    } will be replaced.`
                  : "Translate all over again?"}
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  setConfirming(null);
                  void retranslate();
                }}
              >
                Re-translate
              </Button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              disabled={unsupported}
              onClick={() => setConfirming("redo")}
              className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Re-translate from {LANG_LABEL[primaryLang]}
            </button>
          )}

          <button
            type="button"
            onClick={onMakePrimary}
            className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Make {LANG_LABEL[secondaryLang]} the original
          </button>

          {/* The second language is opted into, so it has to be droppable — an
              option you cannot take back is not one. Confirmed like
              "Re-translate" and for a stronger reason: this discards the whole
              locale, and the original is not a copy of it. */}
          {confirming === "remove" ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[11px] text-muted-foreground">
                Delete this {LANG_LABEL[secondaryLang]} version? Your {LANG_LABEL[primaryLang]}{" "}
                resume is not touched.
              </span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => {
                  setConfirming(null);
                  onRemove();
                }}
              >
                Remove version
              </Button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming("remove")}
              className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Remove {LANG_LABEL[secondaryLang]} version
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-[11px] text-destructive">{error}</p>}
    </section>
  );
};

export default TranslationPanel;
