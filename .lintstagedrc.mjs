import path from "node:path";

const toRelative = (filenames) => filenames.map((f) => path.relative(process.cwd(), f)).join(" ");

const config = {
  "*.{js,jsx,mjs,cjs,ts,tsx}": [
    (filenames) => `oxlint --fix ${toRelative(filenames)}`,
    (filenames) => `oxfmt ${toRelative(filenames)}`,
  ],
  "*.{json,md}": [(filenames) => `oxfmt ${toRelative(filenames)}`],
};

export default config;
