import SectionHeading from "./section-heading";

/**
 * The on-device AI section.
 *
 * It sits before the WebMCP one because these two features actually ship — the
 * agent section is experimental and needs a flag — and because they are the
 * strongest evidence for the claim the page opens with. An AI feature is the
 * obvious place a local-first promise would break, so the point worth making is
 * where the model runs, not that there is one.
 *
 * Everything stated here is checked against the editor: the rewrite actions are
 * the ones in `SECTION_GUIDES` (lib/rewrite.ts), and the language pair is
 * `RESUME_LANGS` (lib/resume-doc.ts).
 */
const OnDevice = () => (
  <section className="border-b border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
      <SectionHeading
        index="02"
        label="On-device AI"
        title={
          <>
            The model runs <br />
            here too<span className="text-[var(--accent)]">.</span>
          </>
        }
      />

      <div className="mt-16 grid grid-cols-1 gap-x-14 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:col-start-4">
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
            Chrome and Edge now ship a model inside the browser. Simple Resume uses it to{" "}
            <span className="text-[var(--graphite)]">rewrite</span> a weak profile or a flat list of
            bullets, and to <span className="text-[var(--graphite)]">translate</span> the whole
            resume between Chinese and English. The model is downloaded once and runs on your
            machine — which is the only reason a page that promises nothing leaves your browser can
            offer this at all.
          </p>

          <dl className="mt-10 border-t border-[var(--rule)] font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--graphite-soft)]">
            {[
              ["Rewrite", "Profile · role bullets"],
              ["Translate", "中文 ⇄ English, whole sheet"],
              ["Runs on", "Your device, after one download"],
            ].map(([term, value]) => (
              <div key={term} className="flex flex-col gap-1.5 border-b border-[var(--rule)] py-4">
                <dt className="text-[10px] tracking-[0.22em] text-[var(--accent)]">{term}</dt>
                <dd className="text-[var(--graphite)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The before/after is the argument: a rewrite is a suggestion you read
            and accept, not something that overwrites the field behind you. */}
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="border border-[var(--rule)] bg-[var(--paper-raised)] p-7 lg:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--graphite-soft)]">
              Start with strong verbs
            </p>

            <p className="mt-6 font-mono text-[0.82rem] leading-[1.7] text-[var(--graphite-soft)] line-through decoration-[var(--rule)]">
              Was responsible for the checkout rewrite and helped with performance work across the
              storefront
            </p>

            <p className="mt-5 border-t border-[var(--rule)] pt-5 font-mono text-[0.82rem] leading-[1.7] text-[var(--graphite)]">
              Led the checkout rewrite onto React Server Components
              <br />
              Cut median page weight by 62% across the storefront
            </p>

            <p className="mt-7 border-t border-[var(--rule)] pt-5 text-[0.9rem] leading-[1.65] text-[var(--graphite-soft)]">
              Every rewrite is shown before it is applied — the field keeps what it has until you
              take the new version. Translate a resume twice and any wording you fixed by hand is
              left alone.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default OnDevice;
