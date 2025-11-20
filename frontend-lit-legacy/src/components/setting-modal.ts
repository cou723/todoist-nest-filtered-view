import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { layoutStyles } from "../styles/common.js";
import "./ui/button.js";
import "./ui/checkbox.js";
import "./ui/input.js";
import "./ui/modal.js";

@customElement("setting-modal")
export class SettingModal extends LitElement {
  @state()
  private filterQuery = "";

  @state()
  private hideDepTodos = false;

  @property({ type: Boolean })
  public modalOpen = false;

  private debounceTimer: number | null = null;
  private readonly DEBOUNCE_DELAY = 500; // 500ms

  public connectedCallback() {
    super.connectedCallback();
    this.filterQuery = localStorage.getItem("todoist_filter_query") || "";
    this.hideDepTodos = localStorage.getItem("todoist_hide_dep_todos") === "true";
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
        detail: { query: this.filterQuery, hideDepTodos: this.hideDepTodos },
        bubbles: true,
        composed: true,
      })
    );
  }

  private closeModal() {
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  public render() {
    return html`
      <ui-modal
        .open=${this.modalOpen}
        title="フィルター設定"
        @modal-close=${this.closeModal}
      >
        <form
          class="filter-form"
          @submit=${(e: Event) => {
            e.preventDefault();
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
          
          <ui-checkbox
            .checked=${this.hideDepTodos}
            .label=${"dep-系タグを持つ依存Todo非表示"}
            .id=${"hide-dep-todos"}
            @checkbox-change=${(e: CustomEvent) => {
              this.hideDepTodos = e.detail.checked;
              localStorage.setItem("todoist_hide_dep_todos", this.hideDepTodos.toString());
              
              if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
              }

              this.debounceTimer = window.setTimeout(() => {
                this.applyFilter();
              }, this.DEBOUNCE_DELAY);
            }}
          ></ui-checkbox>
          <div class="modal-actions">
            <ui-button type="submit">フィルター適用</ui-button>
            <ui-button
              type="button"
              @click=${() => {
                if (this.debounceTimer) {
                  clearTimeout(this.debounceTimer);
                  this.debounceTimer = null;
                }

                this.filterQuery = "";
                this.hideDepTodos = false;
                localStorage.removeItem("todoist_filter_query");
                localStorage.removeItem("todoist_hide_dep_todos");
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
    "setting-modal": SettingModal;
  }
}
