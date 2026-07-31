/**
 * Switches the theme behind a circular wipe centred on whatever was clicked.
 *
 * Shared by the editor's mode menu and the landing page's toggle so the two
 * surfaces flip the same way. Browsers without the View Transition API just get
 * the theme change.
 */
export const applyTheme = (origin: { clientX: number; clientY: number }, setTheme: () => void) => {
  if (!("startViewTransition" in document)) {
    setTheme();
    return;
  }

  const x = origin.clientX;
  const y = origin.clientY;
  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  const transition = document.startViewTransition(setTheme);

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
};
