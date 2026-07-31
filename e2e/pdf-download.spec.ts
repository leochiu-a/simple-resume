import { expect, test } from "@playwright/test";
import { downloadPdfButton, readPdfFacts } from "./helpers";

/**
 * @react-pdf/renderer generates the PDF entirely in the browser via usePDF, so
 * this exercises the renderer + pdfkit + font-embedding path that the
 * @react-pdf/renderer 4.5.1 upgrade touched.
 */
test.describe("PDF download", () => {
  test("produces a valid single-page PDF with fonts and links embedded", async ({ page }) => {
    await page.goto("/resume-editor");

    const button = downloadPdfButton(page);
    await expect(button).toBeEnabled();

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await button.click();
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

    // Github / Medium / Threads render as clickable link annotations.
    expect(pdf.linkAnnotations).toBe(3);
  });

  test("regenerates the PDF after the resume changes", async ({ page }) => {
    await page.goto("/resume-editor");

    const jobTitle = page.getByRole("textbox", { name: /Senior Frontend Engineer/i });
    await jobTitle.fill("Staff Engineer");

    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await downloadPdfButton(page).click();
    const download = await downloadPromise;

    const pdf = readPdfFacts((await download.path())!);
    expect(pdf.header).toBe("%PDF-1.3");
    expect(pdf.hasEof).toBe(true);
    expect(pdf.pages).toBe(1);
  });
});
