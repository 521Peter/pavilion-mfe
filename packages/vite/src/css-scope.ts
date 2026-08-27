/**
 * PostCSS 插件：自动为 CSS 选择器添加 appCode 作用域前缀。
 *
 * 灵感来自 chagee 的 @chagee/vite-plugin-sandbox。
 *
 * 输入：
 *   .card { color: red; }
 *   .container .title { font-size: 12px; }
 *   @keyframes fade { from { opacity: 0; } }
 *
 * 输出（prefix = 'pavilion-mfe-dashboard'）：
 *   :where(.pavilion-mfe-dashboard) .card { color: red; }
 *   :where(.pavilion-mfe-dashboard) .container .title { font-size: 12px; }
 *   @keyframes pavilion-mfe-dashboard-fade { from { opacity: 0; } }
 *
 * :where() 以零优先级包装作用域类，因此作用域样式与原选择器保持相同优先级。
 */

import type { Plugin, Rule, AtRule } from "postcss";

export interface CssScopeOptions {
  /** CSS 类前缀，例如 'pavilion-mfe-dashboard' */
  prefix: string;
  /** 不应添加作用域的文件正则模式 */
  exclude?: RegExp[];
  /** 应添加作用域的文件正则模式（为空时处理全部文件） */
  include?: RegExp[];
}

// ─── 构建时统计 ───
let scopedSelectors = 0;
let skippedSelectors = 0;
let scopedKeyframes = 0;

/**
 * 判断 PostCSS 节点的源文件是否匹配任一排除/包含模式。
 * 文件应添加作用域时返回 false，应跳过时返回 true。
 */
function shouldSkip(node: Rule | AtRule, exclude?: RegExp[], include?: RegExp[]): boolean {
  const file = node.source?.input?.file;
  if (!file) return false;

  if (exclude?.some(re => re.test(file))) return true;
  if (include && include.length > 0 && !include.some(re => re.test(file))) return true;

  return false;
}

/**
 * 为单个 CSS 选择器添加作用域前缀。
 */
function scopeSelector(selector: string, prefix: string): string {
  const trimmed = selector.trim();
  const scope = `:where(.${prefix})`;

  // 子应用中的body,html不添加前缀，添加了会导致样式失效
  if (trimmed === "body" || trimmed === "html") {
    return trimmed;
  }

  // :root → 直接替换为作用域
  if (trimmed === ":root" || trimmed === ":root(") {
    return scope;
  }

  // ::before、::after 等伪元素不能直接添加前缀
  if (trimmed.startsWith("::")) {
    return `${scope} ${trimmed}`;
  }

  // 已添加作用域，跳过
  if (trimmed.startsWith(scope) || trimmed.startsWith(`.${prefix}`)) {
    return trimmed;
  }

  // 特殊选择器需要包装，不能直接添加前缀
  if (trimmed.startsWith("@") || (trimmed.startsWith(":") && !trimmed.startsWith(":where"))) {
    return `${scope} ${trimmed}`;
  }

  // 默认：使用空格组合符添加作用域前缀
  return `${scope} ${trimmed}`;
}

export function cssScopePlugin(options: CssScopeOptions): Plugin {
  const { prefix, exclude, include } = options;

  return {
    postcssPlugin: "pavilion-mfe-css-scope",

    Rule(rule: Rule) {
      // 跳过 @keyframes 内的关键帧选择器（0%、100%、from、to），
      // 它们不能像普通选择器一样添加前缀
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

      // 为关键帧名称添加前缀
      if (atRule.name === "keyframes" || atRule.name === "-webkit-keyframes") {
        atRule.params = `${prefix}-${atRule.params}`;
        scopedKeyframes += 1;
      }
    },

    OnceExit() {
      console.log(
        `[PavilionMfe] CSS scope: prefix=${prefix}  selectors=${scopedSelectors}  skipped=${skippedSelectors}  keyframes=${scopedKeyframes}`
      );
      // 为下一个文件重置状态
      scopedSelectors = 0;
      skippedSelectors = 0;
      scopedKeyframes = 0;
    }
  };
}

cssScopePlugin.postcss = true;
