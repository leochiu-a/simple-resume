import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The closing band, and the last place the signature ramp appears.
 *
 * Full-bleed and at full saturation, which it can only be here: this is the end of the
 * page, there is no body text sitting on it, and the whole point of a band like this is
 * that the page finally raises its voice once. The gradient runs under two lines of
 * large type and a button, nothing that needs to be read carefully at 15px.
 */
const Closing = () => (
  <section className="px-4 pb-4">
    <div className="mx-auto w-full max-w-[1120px] overflow-hidden rounded-[var(--r-xl)] bg-[image:var(--gradient)]">
      <div className="flex flex-col items-start gap-8 px-8 py-16 sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:py-20">
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
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[0.9375rem] font-semibold text-[var(--graphite)] shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)] transition-transform duration-200 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none"
        >
          Create your resume
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </Link>
      </div>
    </div>
  </section>
);

export default Closing;
