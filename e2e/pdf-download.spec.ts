import { expect, test } from "@playwright/test";
import { downloadMenu, downloadPdf, readPdfFacts } from "./helpers";
import { CHINESE, seedResume } from "./seeds";

/**
 * @react-pdf/renderer generates the PDF entirely in the browser via usePDF, so
 * this exercises the renderer + pdfkit + font-embedding path that the
 * @react-pdf/renderer 4.5.1 upgrade touched.
 */
test.describe("PDF download", () => {
  test("produces a valid single-page PDF with fonts and links embedded", async ({ page }) => {
    await page.goto("/resume-editor");

    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("resume.pdf");

    const path = await download.path();
    expect(path).toBeTruthy();

    const pdf = readPdfFacts(path!);

    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.bytes).toBeGreaterThan(10_000);
    expect(pdf.pages).toBe(1);

    // Noto Serif Bold + Noto Sans Regular + Noto Sans Bold, each subset-embedded.
    expect(pdf.embeddedFonts).toHaveLength(3);
    for (const family of ["NotoSerif-Bold", "NotoSans-Regular", "NotoSans-Bold"]) {
      expect(pdf.embeddedFonts.some((f) => f.endsWith(family))).toBe(true);
    }

    // Github / Medium / Threads, plus the project's own url — all four render as
    // clickable link annotations pointing where they say they do.
    expect(pdf.linkAnnotations).toBe(4);
    expect(pdf.linkTargets).toEqual(
      expect.arrayContaining([
        "https://github.com",
        "https://medium.com",
        "https://threads.net",
        "https://github.com/open-resume",
      ]),
    );
  });

  test("regenerates the PDF after the resume changes", async ({ page }) => {
    await page.goto("/resume-editor");

    const jobTitle = page.getByRole("textbox", { name: /Senior Frontend Engineer/i });
    await jobTitle.fill("Staff Engineer");

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    const pdf = readPdfFacts((await download.path())!);
    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.pages).toBe(1);
  });

  /**
   * The Latin files are Noto's *latin* subsets and have no Han in them at all, so
   * a Chinese resume used to download as a page of `.notdef` — drawn with a zero
   * advance, which piles a whole word onto one x rather than leaving a visible
   * gap. Embedding is the thing to assert: the CJK face is only registered when
   * the text needs it, and a subset that never got fetched cannot be in the file.
   *
   * The English test above is the other half of this pair. It pins the count at
   * three, which is what keeps the 5.7MB face off every resume that has no
   * Chinese in it.
   */
  test("embeds the CJK face for a resume written in Chinese", async ({ page }) => {
    await seedResume(page, CHINESE);
    await page.goto("/resume-editor");

    await expect(downloadMenu(page)).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdf(page);
    const download = await downloadPromise;

    const pdf = readPdfFacts((await download.path())!);

    expect(pdf.hasEof).toBe(true);
    expect(pdf.embeddedFonts.some((f) => f.endsWith("NotoSansTC-Regular"))).toBe(true);
  });
});
