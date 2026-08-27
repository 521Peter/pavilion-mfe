export default {
  "*.{js,jsx,ts,tsx,mjs,cjs}": [
    "oxfmt --no-error-on-unmatched-pattern --write",
    "oxlint --no-error-on-unmatched-pattern --fix --deny-warnings --report-unused-disable-directives",
    "cspell lint --no-must-find-files"
  ],
  "*.{json,jsonc,css,less,scss,html}": [
    "oxfmt --no-error-on-unmatched-pattern --write",
    "cspell lint --no-must-find-files"
  ],
  "*.{md,mdx,yaml,yml}": ["oxfmt --no-error-on-unmatched-pattern --write"]
};
