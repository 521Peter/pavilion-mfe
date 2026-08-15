/**
 * PostCSS plugin: auto-prefix CSS selectors with appCode scope.
 *
 * Inspired by chagee's @chagee/vite-plugin-sandbox.
 *
 * Input:
 *   .card { color: red; }
 *   .container .title { font-size: 12px; }
 *   @keyframes fade { from { opacity: 0; } }
 *
 * Output (prefix = 'pavilion-mfe-dashboard'):
 *   :where(.pavilion-mfe-dashboard) .card { color: red; }
 *   :where(.pavilion-mfe-dashboard) .container .title { font-size: 12px; }
 *   @keyframes pavilion-mfe-dashboard-fade { from { opacity: 0; } }
 *
 * :where() wraps the scope class with zero specificity, so scoped
 * styles keep the same specificity as the original selectors.
 */

import type { Plugin, Rule, AtRule } from "postcss";

export interface CssScopeOptions {
  /** CSS class prefix, e.g. 'pavilion-mfe-dashboard' */
  prefix: string;
  /** Regex patterns for files that should NOT be scoped */
  exclude?: RegExp[];
  /** Regex patterns for files that SHOULD be scoped (if empty, scope all) */
  include?: RegExp[];
}

// ─── Build-time stats ───
let scopedSelectors = 0;
let skippedSelectors = 0;
let scopedKeyframes = 0;

/**
 * Determine if a PostCSS node's source file matches any exclude/include pattern.
 * Returns false if the file should be scoped, true if it should be skipped.
 */
function shouldSkip(node: Rule | AtRule, exclude?: RegExp[], include?: RegExp[]): boolean {
  const file = node.source?.input?.file;
  if (!file) return false;

  if (exclude?.some(re => re.test(file))) return true;
  if (include && include.length > 0 && !include.some(re => re.test(file))) return true;

  return false;
}

/**
 * Prepend scope prefix to a single CSS selector.
 */
function scopeSelector(selector: string, prefix: string): string {
  const trimmed = selector.trim();
  const scope = `:where(.${prefix})`;

  // :root → scope directly
  if (trimmed === ":root" || trimmed === ":root(") {
    return scope;
  }

  // ::before, ::after, etc. — pseudo-elements that can't be prefixed
  if (trimmed.startsWith("::")) {
    return `${scope} ${trimmed}`;
  }

  // Already scoped — skip
  if (trimmed.startsWith(scope) || trimmed.startsWith(`.${prefix}`)) {
    return trimmed;
  }

  // Special selectors that need wrapping, not prefixing
  if (trimmed.startsWith("@") || (trimmed.startsWith(":") && !trimmed.startsWith(":where"))) {
    return `${scope} ${trimmed}`;
  }

  // Default: prepend scope with space combinator
  return `${scope} ${trimmed}`;
}

export function cssScopePlugin(options: CssScopeOptions): Plugin {
  const { prefix, exclude, include } = options;

  return {
    postcssPlugin: "pavilion-mfe-css-scope",

    Rule(rule: Rule) {
      // Skip keyframe selectors (0%, 100%, from, to) inside @keyframes —
      // they must not be prefixed like normal selectors
      const parent = rule.parent;
      if (parent?.type === "atrule") {
        const atParent = parent as AtRule;
        if (atParent.name === "keyframes" || atParent.name === "-webkit-keyframes") {
          return;
        }
      }

      if (shouldSkip(rule, exclude, include)) {
        skippedSelectors += rule.selectors.length;
        return;
      }

      rule.selectors = rule.selectors.map(sel => scopeSelector(sel, prefix));
      scopedSelectors += rule.selectors.length;
    },

    AtRule(atRule: AtRule) {
      if (shouldSkip(atRule, exclude, include)) return;

      // Prefix keyframe names
      if (atRule.name === "keyframes" || atRule.name === "-webkit-keyframes") {
        atRule.params = `${prefix}-${atRule.params}`;
        scopedKeyframes++;
      }
    },

    OnceExit() {
      console.log(
        `[PavilionMfe] CSS scope: prefix=${prefix}  selectors=${scopedSelectors}  skipped=${skippedSelectors}  keyframes=${scopedKeyframes}`
      );
      // Reset for next file
      scopedSelectors = 0;
      skippedSelectors = 0;
      scopedKeyframes = 0;
    }
  };
}

cssScopePlugin.postcss = true;
