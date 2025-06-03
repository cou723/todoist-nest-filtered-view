import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { layoutStyles } from "../styles/common.js";
import "./ui/button.js";
import "./ui/input.js";
import "./ui/modal.js";

@customElement("task-filter")
export class TaskFilter extends LitElement {
  @state()
  private filterQuery = "";

  @state()
  private modalOpen = false;

  private debounceTimer: number | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms

  public connectedCallback() {
    super.connectedCallback();
    this.filterQuery = localStorage.getItem("todoist_filter_query") || "";
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
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

  private closeModal() {
    this.modalOpen = false;
  }

  public render() {
    const hasFilter = this.filterQuery.trim() !== "";

    return html`
      <div class="filter-container ${hasFilter ? "has-filter" : "no-filter"}">
        <div class="filter-status">
          <div class="filter-indicator">
            <span class="filter-icon">${hasFilter ? "🔍" : "⚪"}</span>
            <span class="filter-text">
              ${hasFilter
                ? html`<strong>フィルター適用中</strong>`
                : html`フィルター未設定`}
            </span>
          </div>
        </div>
        <ui-button
          @click=${() => (this.modalOpen = true)}
          class="filter-button"
        >
          ${hasFilter ? "フィルター変更" : "フィルター設定"}
        </ui-button>
      </div>

      <ui-modal
        .open=${this.modalOpen}
        title="フィルター設定"
        @modal-close=${this.closeModal}
      >
        <form
          class="filter-form"
          @submit=${(e: Event) => {
            e.preventDefault();
            // デバウンスタイマーをクリアして即座に適用
            if (this.debounceTimer) {
              clearTimeout(this.debounceTimer);
              this.debounceTimer = null;
            }
            this.applyFilter();
            this.closeModal();
          }}
        >
          <label>
            フィルタクエリ:
            <ui-input
              type="text"
              .value=${this.filterQuery}
              @input-change=${(e: CustomEvent) => {
                this.filterQuery = e.detail.value;
                localStorage.setItem("todoist_filter_query", this.filterQuery);

                // デバウンス処理：入力が止まってから一定時間後にフィルターを適用
                if (this.debounceTimer) {
                  clearTimeout(this.debounceTimer);
                }

                this.debounceTimer = window.setTimeout(() => {
                  this.applyFilter();
                }, this.DEBOUNCE_DELAY);
              }}
              placeholder="例: today, p1, @label_name など"
            ></ui-input>
          </label>
          <div class="modal-actions">
            <ui-button type="submit">フィルター適用</ui-button>
            <ui-button
              type="button"
              @click=${() => {
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
                this.closeModal();
              }}
            >
              クリア
            </ui-button>
            <ui-button type="button" @click=${this.closeModal}>
              キャンセル
            </ui-button>
          </div>
        </form>
      </ui-modal>
    `;
  }

  public static styles = [
    layoutStyles,
    css`
      .filter-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1rem;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .filter-container.has-filter {
        border-color: var(--primary-color);
        background: linear-gradient(
          135deg,
          var(--card-bg) 0%,
          rgba(59, 130, 246, 0.05) 100%
        );
      }

      .filter-container.no-filter {
        border-color: var(--border-color);
      }

      .filter-status {
        flex: 1;
        text-align: left;
      }

      .filter-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
      }

      .filter-icon {
        font-size: 1.2rem;
        display: inline-block;
        min-width: 1.5rem;
        text-align: center;
      }

      .filter-text {
        font-size: 0.9rem;
        font-weight: 600;
      }

      .has-filter .filter-text {
        color: var(--primary-color);
      }

      .no-filter .filter-text {
        color: var(--text-color-secondary);
      }

      .filter-button {
        transition: all 0.2s ease;
      }

      .has-filter .filter-button {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
        border-radius: 4px;
      }

      .filter-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

      .modal-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 1rem;
      }

      .modal-actions ui-button {
        min-width: 80px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "task-filter": TaskFilter;
  }
}
