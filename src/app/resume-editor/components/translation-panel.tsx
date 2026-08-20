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
    <div className="mt-5">
      <ProgressBar
        value={downloading ? translator.progress : progress ? progress.done / progress.total : null}
        label={downloading ? "Model download" : "Translation"}
      />
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
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
 *
 * Every control here is a real button at a real size. They were underlined
 * eleven-pixel spans in a wrapping row, which is how a footnote is set, not how
 * a control is — three of them side by side read as small print about the
 * document rather than as the things you can do to it, and the one that deletes
 * the whole locale looked exactly like the one that does nothing but relabel it.
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
  /* One question at a time, and it takes over the row rather than opening
     inside it. Two prompts standing at once — two destructive buttons and two
     `Cancel`s wrapping around each other — is what the row allowed while each
     trigger swapped itself in place. */
  const [confirming, setConfirming] = useState<"redo" | "remove" | null>(null);

  if (!hasLocale) {
    return (
      <section className="mb-10 border p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {LANG_LABEL[secondaryLang]}
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.01em]">
          No {LANG_LABEL[secondaryLang]} version yet
        </h2>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
          Translate your {LANG_LABEL[primaryLang]} resume with the translator built into your
          browser. It runs on this device — the resume is not uploaded anywhere. Afterwards you can
          correct the wording here without touching the {LANG_LABEL[primaryLang]} original.
        </p>

        {busy ? (
          <Progress translation={translation} />
        ) : (
          <>
            {/* Both ways out of the empty slot, at the same height and in the
                same row. The slot is empty because it was just asked for, and
                asking for it is the only way to be here — somewhere to say
                "never mind" is the other half of making the second language
                optional. Set as small print under the offer it declines, it was
                a way out you had to go looking for. */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" size="lg" disabled={unsupported} onClick={() => void run()}>
                Translate from {LANG_LABEL[primaryLang]}
              </Button>
              <Button type="button" size="lg" variant="ghost" className="px-4" onClick={onRemove}>
                Never mind, stay in {LANG_LABEL[primaryLang]} only
              </Button>
            </div>
            <p className="mt-4 max-w-prose text-[13px] leading-relaxed text-muted-foreground">
              {unsupported
                ? `${translator.error ?? "On-device translation needs Chrome 138+ or Edge 148+ on desktop."} You can still write this version by hand.`
                : translator.state === "downloadable"
                  ? "The model is downloaded the first time you do this, and kept for later."
                  : "The model is already on this device."}
            </p>
          </>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </section>
    );
  }

  return (
    <section className="mb-10 border-l-2 border-foreground/20 pl-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {LANG_LABEL[secondaryLang]} · Translation
      </p>
      <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
        This is a translation of your {LANG_LABEL[primaryLang]} resume. Edits here stay here — they
        never change the {LANG_LABEL[primaryLang]} original.
      </p>

      {/* Updating keeps anything rewritten by hand exactly as it is; only the
          untouched fields take the new translation. It is a sentence about the
          document, so it is set as one and given its own line — inline in the
          button row as mono caps it was read as a label on the button next to
          it. */}
      {!busy && !confirming && staleCount > 0 && (
        <p className="mt-4 text-[15px] leading-relaxed text-foreground">
          {staleCount} {staleCount === 1 ? "field has" : "fields have"} changed in the{" "}
          {LANG_LABEL[primaryLang]} original.
        </p>
      )}

      {busy ? (
        <Progress translation={translation} />
      ) : confirming ? (
        /* Distinct from "Update translation": that one protects your rewrites,
           these throw work away. Hence the confirm step, which replaces the row
           so the question is the only thing in it. */
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-[15px] leading-relaxed text-foreground">
            {confirming === "redo"
              ? editedCount > 0
                ? `Translate all over again? ${editedCount} ${
                    editedCount === 1 ? "field you rewrote" : "fields you rewrote"
                  } will be replaced.`
                : "Translate all over again?"
              : `Delete this ${LANG_LABEL[secondaryLang]} version? Your ${LANG_LABEL[primaryLang]} resume is not touched.`}
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setConfirming(null);
              if (confirming === "redo") void retranslate();
              else onRemove();
            }}
          >
            {confirming === "redo" ? "Re-translate" : "Remove version"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirming(null)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {staleCount > 0 && (
            <Button type="button" disabled={unsupported} onClick={() => void run()}>
              Update translation
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={unsupported}
            onClick={() => setConfirming("redo")}
          >
            Re-translate from {LANG_LABEL[primaryLang]}
          </Button>

          <Button type="button" variant="outline" onClick={onMakePrimary}>
            Make {LANG_LABEL[secondaryLang]} the original
          </Button>

          {/* The second language is opted into, so it has to be droppable — an
              option you cannot take back is not one. Last in the row and the
              only ghost in it: reachable without being one of the things the
              row offers first. */}
          <Button type="button" variant="ghost" onClick={() => setConfirming("remove")}>
            Remove {LANG_LABEL[secondaryLang]} version
          </Button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </section>
  );
};

export default TranslationPanel;
