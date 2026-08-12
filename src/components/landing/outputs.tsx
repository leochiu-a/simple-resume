import { Code2, Eye, FileDown, Languages, Share2, Undo2 } from "lucide-react";

/**
 * The bento grid.
 *
 * Tiles are deliberately unequal — two wide ones carrying the claims that need a
 * paragraph, four narrow ones for the facts that need a line. A bento where every
 * tile is the same size is a table with rounded corners, and it reads as one.
 *
 * The copy here used to be set as a numbered colophon (`i`, `ii`, `iii`) in the
 * voice of a printer's specimen book. It says the same things now without
 * cataloguing them, because a product page's job is to be understood on one pass.
 */
const TILES = [
  {
    icon: Eye,
    title: "The preview is the PDF",
    body: "Not a picture of it — the same element tree the export is built from, rendered into an iframe. What you are looking at is what prints.",
    span: "sm:col-span-2",
  },
  {
    icon: FileDown,
    title: "PDF, properly",
    body: "A4 with the fonts embedded, text selectable and links live. Long resumes paginate on whole entries, so a job never opens on one page and finishes on the next.",
    span: "sm:col-span-2",
  },
  {
    icon: Code2,
    title: "Single-file HTML",
    body: "One document, every style inlined. Host it, email it, or keep it in git as text.",
    span: "",
  },
  {
    icon: Languages,
    title: "中文 ⇄ English",
    body: "Translate the whole sheet in place, with the layout holding either way.",
    span: "",
  },
  {
    icon: Share2,
    title: "Share as a link",
    body: "The resume travels inside the URL itself — still nothing stored on a server.",
    span: "",
  },
  {
    icon: Undo2,
    title: "Nothing to lose",
    body: "Saved to this browser as you type. No account to forget the password to.",
    span: "",
  },
];

const Outputs = () => (
  <section id="outputs" className="scroll-mt-24 border-t border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
        What you get
      </p>
      <h2 className="mt-3 max-w-[30ch] font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
        One resume in, three ways out.
      </h2>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {TILES.map(({ icon: Icon, title, body, span }) => (
          <div
            key={title}
            className={`rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-6 shadow-[var(--shadow-sm),var(--highlight)] transition-shadow duration-200 hover:shadow-[var(--shadow-md),var(--highlight)] motion-reduce:transition-none ${span}`}
          >
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-[10px] bg-[var(--wash)] text-[var(--accent)]"
            >
              <Icon className="size-[1.05rem]" />
            </span>
            <h3 className="mt-4 font-display text-[1.0625rem] font-semibold tracking-[-0.012em]">
              {title}
            </h3>
            <p className="mt-2 max-w-[46ch] text-[0.9375rem] leading-[1.6] text-[var(--graphite-soft)]">
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Outputs;
