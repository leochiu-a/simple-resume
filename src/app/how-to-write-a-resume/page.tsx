import type { Metadata } from "next";
import Link from "next/link";

import AccentProvider from "@/components/landing/accent";
import SiteFooter from "@/components/landing/site-footer";
import SiteNav from "@/components/landing/site-nav";
import { EDITS } from "@/components/landing/guide/edits";
import RewriteGuide from "@/components/landing/guide/rewrite-guide";
import { SITE_URL } from "@/constants/site";

const DESCRIPTION =
  "Six edits that take one badly written resume to a good one, applied to a real sheet as you scroll: name the job, cut the objective, most recent first, verb and number, trim the skills, spend the top third.";

const TITLE = "How to write a resume — six edits, shown on the page";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/how-to-write-a-resume`,
  },
};

/**
 * The writing guide.
 *
 * Every product like this one has a page of resume tips, and they are all the same
 * page: assertions about resumes with nothing under them. The difference here is
 * that each of the six carries the change itself, animated at reading size — the
 * line before, the line after, the list getting shorter.
 *
 * It is deliberately not shaped like `/how-ai-works`. That page is an explanation
 * with figures down a wide grid; this one is a single measure of type, because it
 * is read rather than consulted.
 */
const HowToWriteAResume = () => (
  <AccentProvider>
    <SiteNav />

    <main>
      <section className="relative overflow-hidden">
        <div aria-hidden className="landing-ambient" />

        <div className="mx-auto w-full max-w-[1120px] px-6 pb-4 pt-16 lg:pt-24">
          <div className="mx-auto max-w-[46rem]">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--graphite-soft)]">
              Writing guide · six edits
            </p>

            <h1 className="mt-5 max-w-[18ch] font-display text-[clamp(2.4rem,5vw,3.85rem)] font-semibold leading-[1.03] tracking-[-0.032em]">
              A good resume is{" "}
              <span className="bg-[image:var(--gradient)] bg-clip-text text-transparent">
                six edits
              </span>{" "}
              from a bad one.
            </h1>

            <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.65] text-[var(--graphite-soft)]">
              Almost none of it is writing talent. Most resumes that read as a form someone filled
              in are one good draft with six ordinary decisions on top of it, each of which takes
              about a minute to reverse. Here is each one, with the line it changes.
            </p>

            {/* The six, up front. A reader who already knows this material should be
                able to take the list and leave without scrolling the whole page. */}
            <nav aria-label="The six edits" className="mt-12">
              {/* The list's closing rule is left to the first edit's own `border-t`,
                  a section's padding below it: two hairlines that close the same
                  list read as one thing drawn twice. */}
              <ol className="border-t border-[var(--rule)]">
                {EDITS.map((edit, index) => (
                  <li key={edit.id} className="border-b border-[var(--rule)] last:border-b-0">
                    <Link
                      href={`#${edit.id}`}
                      className="flex items-baseline gap-3 py-3.5 text-[0.9375rem] leading-[1.45] transition-colors duration-200 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    >
                      <span className="font-mono text-[0.6875rem] text-[var(--graphite-soft)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {edit.title.replace(/\.$/, "")}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </section>

      <RewriteGuide />
    </main>

    <SiteFooter />
  </AccentProvider>
);

export default HowToWriteAResume;
