import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-button")
export class UIButton extends LitElement {
  @property({ type: String })
  public type: "button" | "submit" = "button";

  @property({ type: Boolean })
  public disabled = false;

  @property({ type: String })
  public variant: "default" | "primary" | "secondary" = "default";

  public render() {
    return html`
      <button
        type=${this.type}
        ?disabled=${this.disabled}
        class=${this.variant}
      >
        <slot></slot>
      </button>
    `;
  }

  public static styles = css`
    button {
      padding: 0.5em 1.5em;
      font-size: 1em;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--button-bg);
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.25s ease;
    }

    button:hover:not(:disabled) {
      background-color: var(--button-hover-bg);
      border-color: var(--primary-color);
    }

    button:focus,
    button:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Primary variant */
    button.primary {
      background-color: var(--primary-color, #007bff);
      color: white;
      border-color: var(--primary-color, #007bff);
    }

    button.primary:hover:not(:disabled) {
      background-color: var(--primary-hover-color, #0056b3);
      border-color: var(--primary-hover-color, #0056b3);
    }

    /* Secondary variant */
    button.secondary {
      background-color: transparent;
      color: var(--text-color);
      border: 1px solid var(--border-color, #ccc);
    }

    button.secondary:hover:not(:disabled) {
      background-color: var(--secondary-hover-bg, #f8f9fa);
      border-color: var(--text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-button": UIButton;
  }
}
