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

/** The types `page.tsx` tags its two directions with. */
const TYPES = ["appearance-open", "appearance-close"] as const;

interface RecordedTransition {
  /** Which of `TYPES` were active when the transition was captured. */
  types: string[];
  /** One entry per animated pseudo-element: `["::view-transition-old(root)", 180]`. */
  animations: [string, number][];
}

declare global {
  interface Window {
    __recorded?: RecordedTransition[];
  }
}

/**
 * The window the stylesheet asks for, read from the stylesheet.
 *
 * Not a copy of the number. `--appearance-swap-duration` is the one place it is
 * written, and a test carrying its own `180` would go on passing after that
 * property was retuned — while what is worth pinning is that the animations the
 * browser ran are the ones the module declared. That is precisely what breaks when
 * a class silently fails to apply and the browser falls back to its own default.
 */
const declaredDuration = (page: Page) =>
  page.evaluate(() => {
    const declared = getComputedStyle(document.documentElement)
      .getPropertyValue("--appearance-swap-duration")
      .trim();

    /* The unit is read rather than assumed, because the production build does not
       serve back what the module wrote: `180ms` is minified to `.18s`. A bare
       `parseFloat` reports 0.18 and every comparison against a duration in
       milliseconds fails — which is how this was found. */
    return Number.parseFloat(declared) * (declared.endsWith("ms") ? 1 : 1000);
  });

/**
 * Records every view transition `act` causes, and waits for one to be captured.
 *
 * The wrapper is installed before the click rather than after, because a transition
 * cannot be inspected once it has finished — `ready` is the only moment the
 * pseudo-elements exist to be measured.
 *
 * The wait is a step of its own rather than the click's. `openAppearanceMenu` and
 * `closeAppearance` return when the DOM says the panel has arrived or gone, and the
 * DOM commits *before* `ready` resolves — so reading the array straight after the
 * click is a race that merely happens to be winnable.
 */
const recordTransitions = async (
  page: Page,
  act: () => Promise<void>,
): Promise<RecordedTransition[]> => {
  await page.evaluate((types) => {
    const recorded: RecordedTransition[] = [];
    window.__recorded = recorded;

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
        // A skipped transition records nothing at all. The wait below is what turns
        // that into a failure rather than this swallowing it.
        () => {},
      );

      return transition;
    };
  }, TYPES);

  await act();
  await page.waitForFunction(() => (window.__recorded?.length ?? 0) > 0);

  return page.evaluate(() => window.__recorded!);
};

/** One transition per swap, and it is the one under test. */
const onlyTransition = (recorded: RecordedTransition[]) => {
  expect(recorded).toHaveLength(1);

  return recorded[0];
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
    const duration = await declaredDuration(page);
    const ran = onlyTransition(await recordTransitions(page, () => openAppearanceMenu(page)));

    expect(ran.types).toEqual(["appearance-open"]);
    // `arrayContaining` because the browser adds group animations of its own. The
    // two named here are the two halves of the cross-fade.
    expect(ran.animations).toEqual(
      expect.arrayContaining([
        ["::view-transition-old(root)", duration],
        ["::view-transition-new(panel)", duration],
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
    const duration = await declaredDuration(page);
    await openAppearanceMenu(page);

    const ran = onlyTransition(await recordTransitions(page, () => closeAppearance(page)));

    expect(ran.types).toEqual(["appearance-close"]);
    expect(ran.animations).toContainEqual(["::view-transition-old(panel)", duration]);
    expect(ran.animations.map(([pseudo]) => pseudo)).not.toContain("::view-transition-old(root)");
  });

  /**
   * The reduced-motion rule in `globals.css` is app-wide and shipped with nothing
   * checking it, which for an accessibility rule is the wrong way round — it is an
   * `!important` override on pseudo-elements nobody ever looks at, so it can rot
   * without anyone noticing.
   *
   * Zero rather than absent: the states still swap, which is what the browser does
   * with no transition at all, so the animations exist and have no duration.
   */
  test("swaps the column with no motion at all under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    const ran = onlyTransition(await recordTransitions(page, () => openAppearanceMenu(page)));

    expect(ran.animations.length).toBeGreaterThan(0);
    for (const [pseudo, duration] of ran.animations) {
      expect(duration, `${pseudo} should not animate under reduced motion`).toBe(0);
    }
  });
});
