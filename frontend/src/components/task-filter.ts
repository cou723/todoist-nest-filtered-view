import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { layoutStyles } from "../styles/common.js";
import "./ui/button.js";
import "./ui/input.js";

@customElement("task-filter")
export class TaskFilter extends LitElement {
  @state()
  private filterQuery: string = "";

  private debounceTimer: number | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms

  connectedCallback() {
    super.connectedCallback();
    this.filterQuery = localStorage.getItem("todoist_filter_query") || "";
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private handleFilterQueryInput(e: CustomEvent) {
    this.filterQuery = e.detail.value;
    localStorage.setItem("todoist_filter_query", this.filterQuery);

    // デバウンス処理：入力が止まってから一定時間後にフィルターを適用
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.applyFilter();
    }, this.DEBOUNCE_DELAY);
  }

  private applyFilter() {
    this.dispatchEvent(
      new CustomEvent("filter-apply", {
        detail: { query: this.filterQuery },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleFilterSubmit(e: Event) {
    e.preventDefault();
    // デバウンスタイマーをクリアして即座に適用
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.applyFilter();
  }

  private handleClearFilter() {
    // デバウンスタイマーをクリア
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.filterQuery = "";
    localStorage.removeItem("todoist_filter_query");
    this.dispatchEvent(
      new CustomEvent("filter-clear", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <form class="filter-form" @submit=${this.handleFilterSubmit}>
        <label>
          フィルタクエリ:
          <ui-input
            type="text"
            .value=${this.filterQuery}
            @input-change=${this.handleFilterQueryInput}
            placeholder="例: today, p1, @label_name など"
          ></ui-input>
        </label>
        <ui-button type="submit">フィルター適用</ui-button>
        <ui-button type="button" @click=${this.handleClearFilter}>
          すべて表示
        </ui-button>
      </form>
    `;
  }

  static styles = [
    layoutStyles,
    css`
      .filter-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
        text-align: left;
      }

      .filter-form label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-weight: bold;
        color: var(--text-color);
      }

      .filter-form ui-input {
        width: 100%;
        box-sizing: border-box;
      }

      .filter-form ui-button {
        margin: 0.25rem;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "task-filter": TaskFilter;
  }
}
