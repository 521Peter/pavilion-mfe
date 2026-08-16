// .lintstagedrc.js
export default {
  "*.{js,ts,mjs,cjs,json,tsx,css,less,scss,vue,html}": ["cspell lint --no-must-find-files"],
  "*.{js,ts,vue,md}": ["prettier --write"]
};
