import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { resetCss } from "../../styles/reset";

@customElement("ui-modal")
export class Modal extends LitElement {
  @property({ type: Boolean })
  public open = false;

  @property()
  public title = "";

  private close() {
    this.dispatchEvent(
      new CustomEvent("modal-close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleEscapeKey(e: KeyboardEvent) {
    if (e.key === "Escape" && this.open) {
      this.close();
    }
  }

  public connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleEscapeKey.bind(this));
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleEscapeKey.bind(this));
  }

  public render() {
    if (!this.open) return html``;

    return html`
      <div
        class="modal-backdrop"
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) {
            this.close();
          }
        }}
      >
        <div class="modal-content">
          <div class="modal-header">
            <h3>${this.title}</h3>
            <button class="close-button" @click=${this.close}>×</button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    `;
  }

  public static styles = [
    resetCss,
    css`
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: var(--card-bg);
        border-radius: 8px;
        box-shadow: 0 4px 16px var(--card-shadow);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
      }

      .modal-header h3 {
        margin: 0;
        color: var(--text-color);
        font-size: 1.25rem;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-color);
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .close-button:hover {
        background: var(--hover-bg);
      }

      .modal-body {
        padding: 1.5rem;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-modal": Modal;
  }
}
