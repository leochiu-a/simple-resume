import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/arrow-right";

/**
 * The closing band, and the last place the signature ramp appears.
 *
 * At full saturation, which it can only be here: this is the end of the page, there is
 * no body text sitting on it, and the whole point of a band like this is that the page
 * finally raises its voice once. The gradient runs under two lines of large type and a
 * button, nothing that needs to be read carefully at 15px.
 *
 * The panel deliberately straddles the seam where the wash block above it ends: it is
 * pulled 40px up over the rule, so the line runs the full width of the page and disappears
 * behind it. Flush against that seam — which is what no top padding gave — reads as a
 * section that failed to get its rhythm; crossing it reads as a panel placed on top of the
 * page. 40px is chosen so the rule terminates inside the panel's own top padding at every
 * breakpoint, above the headline rather than level with it, while still being far too much
 * to look like a rounding error.
 *
 * The container is the same 1120 box every other section uses, which puts the panel's left
 * edge exactly on the page's text column — the version that cut its own margin had the
 * panel edge, its headline and the footer text all landing on three different lines.
 *
 * The overlap eats into the wash section's bottom padding, never its content, and the
 * panel paints after it because it comes later in the document.
 */
const Closing = () => (
  <section className="border-t border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1120px] px-6 pb-24 lg:pb-32">
      <div className="-mt-10 flex flex-col items-start gap-8 overflow-hidden rounded-[var(--r-xl)] bg-[image:var(--gradient)] px-8 py-14 shadow-[0_1px_2px_rgb(9_11_28/0.06),0_24px_48px_-18px_rgb(9_11_28/0.28)] sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:py-16">
        <div>
          <h2 className="max-w-[24ch] font-display text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.028em] text-white">
            Write it once. Keep it yours.
          </h2>
          <p className="mt-4 max-w-[46ch] text-[1rem] leading-[1.6] text-white/85">
            No account, no upload, no tiers. Open the editor and start typing — it saves as you go.
          </p>
        </div>

        <Link
          href="/resume-editor"
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[0.9375rem] font-semibold text-[var(--graphite-fixed)] shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)] transition-transform duration-200 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
        >
          Create your resume
          <ArrowRightIcon
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </div>
    </div>
  </section>
);

export default Closing;
