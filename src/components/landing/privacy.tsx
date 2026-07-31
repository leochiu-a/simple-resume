import SectionHeading from "./section-heading";

const Privacy = () => (
  <section className="border-b border-[var(--rule)]">
    <div className="mx-auto w-full max-w-[1280px] px-6 py-20 lg:px-10 lg:py-28">
      <SectionHeading
        index="03"
        label="Privacy"
        title={
          <>
            No account. No upload. <br />
            Nothing to leak
            <span className="text-[var(--ink-display)]">.</span>
          </>
        }
      />

      <div className="mt-14 grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-9 lg:col-start-4">
          <p className="max-w-[62ch] text-[1.0625rem] leading-[1.72] text-[var(--graphite-soft)]">
            A resume is a list of everywhere you have worked, your phone number and your address.
            This one is written straight into your browser&rsquo;s local storage and read back from
            there — no sign-up, no database, no draft sitting in someone else&rsquo;s account. Clear
            the site data and it is gone, which is the other half of the same promise.
          </p>

          {/* Said plainly, because a privacy claim with an asterisk hidden in it is
              worse than no claim. */}
          <p className="mt-8 max-w-[62ch] border-t border-[var(--rule)] pt-5 font-mono text-[0.78rem] leading-[1.85] text-[var(--graphite-soft)]">
            <span className="uppercase tracking-[0.2em] text-[var(--ink-display)]">
              Full disclosure
            </span>{" "}
            — page views are counted with Vercel Analytics, and the sheet loads Noto Sans and Noto
            Serif from Google Fonts. Neither of those ever sees what you typed.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Privacy;
