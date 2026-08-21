import { expect, test, type Page } from "@playwright/test";

import { closeAppearance, openAppearanceMenu } from "./helpers";

/**
 * The editing column cross-fades between the form and the appearance panel, and
 * every part of that is capable of failing silently.
 *
 * Nothing throws if the swap stops animating. Drop the `startTransition` in
 * `resume-editor/page.tsx` and React never calls `startViewTransition`; let a CSS
 * Modules hash come out containing `+` and the class is not a legal
 * `view-transition-class`, so it is ignored; write the root rules in
 * `appearance-transition.module.css` without `:global(…)` and they compile to a
 * snapshot name that does not exist. In all three cases the column still swaps,
 * the panel still works, and every other test here still passes.
 *
 * So this measures what the browser actually ran. `getAnimations()` at
 * `transition.ready` reports the animations on the view-transition pseudo-elements,
 * which is the only place the answer exists — a screenshot cannot show it, because
 * the snapshots are painted by the compositor and not by the DOM.
 */

/** What the stylesheet asks for, in ms. Both directions share the window. */
const DURATION = 180;

interface Ran {
  /** The transition types active when the transition was captured. */
  types: string[];
  /** One entry per animated pseudo-element: `["::view-transition-old(root)", 180]`. */
  animations: [string, number][];
}

/**
 * Records the next view transition, runs `act`, and reports what animated.
 *
 * The wrapper is installed before the click rather than after, because a
 * transition cannot be inspected once it has finished — `ready` is the only moment
 * the pseudo-elements exist to be measured.
 */
const recordTransition = async (page: Page, act: () => Promise<void>): Promise<Ran[]> => {
  await page.evaluate(
    (types) => {
      const recorded: Ran[] = [];
      (window as unknown as { __transitions: Ran[] }).__transitions = recorded;

      const start = document.startViewTransition.bind(document);
      document.startViewTransition = (update: Parameters<typeof start>[0]) => {
        const transition = start(update);

        transition.ready.then(
          () =>
            recorded.push({
              types: types.filter((type) =>
                document.documentElement.matches(`:active-view-transition-type(${type})`),
              ),
              animations: document
                .getAnimations()
                // `pseudoElement` lives on `KeyframeEffect`, and `Animation.effect`
                // is typed as the base `AnimationEffect`. Every animation a view
                // transition creates is a keyframe effect.
                .map((animation) => animation.effect as KeyframeEffect | null)
                .filter((effect) => effect?.pseudoElement?.startsWith("::view-transition-"))
                .map((effect) => [
                  // React names the boundary itself, and the name it picks is an
                  // implementation detail — the pseudo-element is normalised to
                  // `panel` so this test pins the shape and not React's counter.
                  effect!.pseudoElement!.replace(/\(_t_\d+_\)/, "(panel)"),
                  Number(effect!.getComputedTiming().duration),
                ]),
            }),
          // A skipped transition records nothing, which fails the assertions below
          // with the empty array rather than hanging.
          () => {},
        );

        return transition;
      };
    },
    ["appearance-open", "appearance-close"],
  );

  await act();

  return page.evaluate(() => (window as unknown as { __transitions: Ran[] }).__transitions);
};

test.describe("appearance panel transition", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/resume-editor");
  });

  /**
   * Opening, the two halves cross: root's old frame still holds the form, so it is
   * the form's exit, and it runs over the same window as the panel's arrival. The
   * delay this deliberately does not have is the point — staggering them left the
   * form dissolving into a blank column, which reads as content vanishing.
   */
  test("crosses the form and the panel over one window on the way in", async ({ page }) => {
    const [ran, ...rest] = await recordTransition(page, () => openAppearanceMenu(page));

    expect(rest).toEqual([]);
    expect(ran.types).toEqual(["appearance-open"]);
    expect(ran.animations).toEqual(
      expect.arrayContaining([
        ["::view-transition-old(root)", DURATION],
        ["::view-transition-new(panel)", DURATION],
      ]),
    );
  });

  /**
   * Closing, root's old frame is the column with the panel already lifted out of it
   * — a picture of blank paper, over a form that is back at full opacity from the
   * first frame. Drawing it put a second decaying layer over live text, which is
   * the flicker the `appearance-close` type exists to remove, so the panel's own
   * exit should be the only thing animating.
   */
  test("animates only the panel's exit on the way out", async ({ page }) => {
    await openAppearanceMenu(page);

    const [ran, ...rest] = await recordTransition(page, () => closeAppearance(page));

    expect(rest).toEqual([]);
    expect(ran.types).toEqual(["appearance-close"]);
    expect(ran.animations).toContainEqual(["::view-transition-old(panel)", DURATION]);
    expect(ran.animations.map(([pseudo]) => pseudo)).not.toContain("::view-transition-old(root)");
  });
});
