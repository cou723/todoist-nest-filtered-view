import { nothing } from "lit";
import type { TemplateResult } from "lit";

/**
 * 条件付きレンダリングのためのユーティリティ関数
 * 条件がtruthyの場合のみテンプレートをレンダリングし、そうでなければnothingを返す
 *
 * @param condition - 評価する条件
 * @param template - 条件がtruthyの場合にレンダリングするテンプレート
 * @returns 条件に応じてテンプレートまたはnothing
 *
 * @example
 * ```typescript
 * ${when(isVisible, html`<div>表示内容</div>`)}
 * ${when(user?.name, html`<span>Hello, ${user.name}!</span>`)}
 * ```
 */
export function when(
  condition: unknown,
  template: TemplateResult
): TemplateResult | typeof nothing {
  return condition ? template : nothing;
}
