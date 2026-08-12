import { HardDrive, KeyRound, ServerOff } from "lucide-react";

/**
 * Three facts, then the asterisk spelled out.
 *
 * The disclosure block is the point of this section. A privacy claim with something
 * hidden in the small print is worse than no claim, so the things that *do* leave the
 * browser are listed here rather than being left for someone to find in the network
 * tab — and none of them ever sees what was typed.
 */
const FACTS = [
  {
    icon: KeyRound,
    title: "No account",
    body: "Nothing to sign up for, so there is no password, no email on a list and no profile to delete later.",
  },
  {
    icon: HardDrive,
    title: "Stored in this browser",
    body: "Written straight into local storage and read back from there. Clear the site data and it is gone — that is the other half of the same promise.",
  },
  {
    icon: ServerOff,
    title: "No database",
    body: "There is no server holding a copy, because there is no server. Exports and share links are built in the page itself.",
  },
];

const Privacy = () => (
  <section id="privacy" className="scroll-mt-24 border-t border-[var(--rule)] bg-[var(--wash)]">
    <div className="mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
        Privacy
      </p>
      <h2 className="mt-3 max-w-[26ch] font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.028em]">
        No account. No upload. Nothing to leak.
      </h2>
      <p className="mt-5 max-w-[58ch] text-[1rem] leading-[1.65] text-[var(--graphite-soft)]">
        A resume is a list of everywhere you have worked, your phone number and your address. That
        is a strange thing to hand to a stranger&rsquo;s database, so this one never is.
      </p>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FACTS.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-[var(--r-lg)] border border-[var(--rule)] bg-[var(--paper-raised)] p-6 shadow-[var(--shadow-sm),var(--highlight)]"
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
            <p className="mt-2 text-[0.9375rem] leading-[1.6] text-[var(--graphite-soft)]">
              {body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[var(--r-lg)] border border-dashed border-[var(--rule-strong)] p-6">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-[var(--accent)]">
          Full disclosure
        </p>
        <p className="mt-3 max-w-[76ch] text-[0.9375rem] leading-[1.7] text-[var(--graphite-soft)]">
          Page views are counted with Vercel Analytics, the sheet loads Noto Sans and Noto Serif
          from Google Fonts, and the rewrite and translate features download a model from your
          browser&rsquo;s vendor the first time you use them. None of those ever sees what you
          typed.
        </p>
      </div>
    </div>
  </section>
);

export default Privacy;
