import { Resume } from "@/types/resume";

import type useTemplateOptions from "../hooks/useTemplateOptions";
import ResumeIframeCSR from "./template/resume-iframe";
import AppearanceTrigger from "./template/appearance-trigger";

/**
 * The desktop preview: the sheet, its page pager, and the appearance panel that
 * floats over it.
 *
 * This used to be `sticky` with a `top` computed from the height of the two bars
 * above it, and the form column beside it scrolled the whole page. That is what
 * made the two columns share one scrollbar — the preview was not scrolling at
 * all, it was parked while the document moved under it, and the arithmetic in the
 * old `top-[calc(56px+44px)]` was the tell.
 *
 * Now the page itself does not scroll: the editor is a fixed-height flex column,
 * and this pane is its own `overflow-y-auto` region. The form is another. Two
 * panes, two scrollbars, neither aware of the other, and no magic numbers to keep
 * in step with the header.
 */
const ResumePreview = ({
  resume,
  options,
  onOpenAppearance,
}: {
  resume: Resume;
  options: ReturnType<typeof useTemplateOptions>;
  onOpenAppearance: () => void;
}) => {
  const { template, backgroundColor } = options;

  return (
    // `group` is what the appearance panel's hover reveal keys off: the whole
    // desk is the hover target, not the button, so the control appears as soon as
    // the pointer is anywhere near the sheet.
    //
    // A wash one step off the paper, so the sheet reads as a sheet lying on a desk
    // rather than as white on white.
    <div data-preview-pane className="group relative w-1/2 border-l bg-muted/40">
      {/* The sheet fills this box rather than sitting in a padded well inside it.
          px-6 is CROP_MARK_GUTTER — the marks live outside the trim and this box
          clips, so that much has to stay, and it is the only padding left: the
          sheet scales itself to whatever room it is given, so anything more just
          made it smaller for no reason. */}
      <div className="scrollbar-overlay h-full overflow-y-auto px-6">
        <ResumeIframeCSR>{template.render({ resume, backgroundColor })}</ResumeIframeCSR>
      </div>

      {/* Centred over the sheet, and outside the scrolling box so it stays put as
          the sheet moves under it.

          The middle is the one place the pointer reliably passes through on its
          way to anywhere in this pane, which is what a hover-revealed control
          wants — a corner asks you to already know it is there. It only appears
          on hover, so it covers the resume solely at the moment you have chosen
          to reach for it, and `-translate-x/y-1/2` centres the button on the
          point rather than hanging it off one.

          Positioned directly rather than through a flex row. A wrapper spanning
          the pane needed `pointer-events-none` to avoid swallowing clicks on the
          sheet, and that also stopped the pointer registering as inside the pane
          — which is exactly what `group-hover` reads, so the reveal never fired.
          A single absolutely-positioned button covers only itself. */}
      <AppearanceTrigger
        onOpen={onOpenAppearance}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};

export default ResumePreview;
