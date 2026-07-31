import SectionHeading from "./section-heading";

const OUTPUTS = [
  {
    index: "i",
    title: "Live preview",
    body: "The preview is not a picture of the PDF — it is the same element tree the PDF is built from, rendered into an iframe. What you are looking at is what prints.",
  },
  {
    index: "ii",
    title: "PDF",
    body: "A4, with the fonts embedded, the text selectable and the links live. Long resumes paginate on whole entries, so a job never opens on one page and finishes on the next.",
  },
  {
    index: "iii",
    title: "Single-file HTML",
    body: "One document, every style inlined, nothing to ship alongside it. Host it as your personal page, paste it into an email, or keep it in git as text — and printing it gives the PDF back.",
  },
];

const Outputs = () => (
  <section className="border-b border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
      <SectionHeading
        index="01"
        label="Outputs"
        title={
          <>
            One resume, <br />
            three ways out<span className="text-[var(--ink-display)]">.</span>
          </>
        }
      />

      {/* Held to the same columns the heading starts in, so the section reads as one
          block with its number alone out in the margin. */}
      <div className="mt-16 lg:grid lg:grid-cols-12 lg:gap-x-14">
        <div className="grid grid-cols-1 gap-x-14 gap-y-12 md:grid-cols-3 lg:col-span-9 lg:col-start-4">
          {OUTPUTS.map(({ index, title, body }) => (
            <article key={title} className="border-t border-[var(--graphite)] pt-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ink-display)]">
                {index}
              </p>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em]">
                {title}
              </h3>
              <p className="mt-3 text-[0.975rem] leading-[1.72] text-[var(--graphite-soft)]">
                {body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Outputs;
