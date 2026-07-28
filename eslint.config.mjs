import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      "no-console": "error",

      // eslint-config-next 16 turns on the React Compiler rules from
      // eslint-plugin-react-hooks v6. These flag pre-existing, deliberate
      // patterns (e.g. the mounted-gate in resume-editor/page.tsx that guards
      // against reading localStorage during SSR), not bugs. Kept as warnings so
      // the signal stays visible without blocking; worth revisiting per-component.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
];

export default config;
