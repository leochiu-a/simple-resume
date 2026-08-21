import type { ReactNode } from "react";

/**
 * `ViewTransition` exists in the React this app runs and not in the React it
 * typechecks against.
 *
 * The App Router does not use the `react` in node_modules: Next bundles its own
 * canary build, and that one exports `ViewTransition` — `next/dist/compiled/react`
 * has it, `react@19.2.8` does not, and neither does `@types/react@19.2`. So the
 * import resolves at build time and fails under `tsc --noEmit`, which is the check
 * CI runs.
 *
 * Declared here rather than cast to `any` at the import site, so the prop *names*
 * are still checked — a misspelled `enter` is silent at runtime, the transition
 * simply does not play, and `any` would keep it silent here too.
 *
 * The values are not checked and cannot usefully be: they are class names, so the
 * type is `string`. `"auto" | "none" | string` would read as a constraint while
 * collapsing to exactly the same `string`, which is worse than saying nothing — the
 * two special values are documented on each prop instead. What the values are for
 * is `appearance-transition.spec.ts`'s job, since it measures what the browser
 * actually animated.
 *
 * Only the props the app passes. The component takes several more (`name`,
 * `share`, `update`, the `on*` callbacks, and object forms of each class prop
 * keyed by transition type); add them here when something needs them, so this file
 * never claims to describe an API nobody here has tried.
 */
declare module "react" {
  /**
   * Tags the Transition currently being set up, so CSS can select on it with
   * `:root:active-view-transition-type(…)`. Only meaningful inside the callback
   * passed to `startTransition`.
   */
  export function addTransitionType(type: string): void;

  export const ViewTransition: (props: {
    children: ReactNode;
    /**
     * The class applied to every trigger not named below. `"none"` turns those
     * triggers off, which is what keeps a boundary out of unrelated transitions;
     * `"auto"` is the browser's own cross-fade.
     */
    default?: string;
    /** Applied when this boundary is mounted during a Transition. */
    enter?: string;
    /** Applied when this boundary is removed during a Transition. */
    exit?: string;
  }) => ReactNode;
}
