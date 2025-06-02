import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-input")
export class UIInput extends LitElement {
  @property({ type: String })
  type: "text" | "password" = "text";

  @property({ type: String })
  placeholder: string = "";

  @property({ type: String })
  value: string = "";

  @property({ type: Boolean })
  disabled: boolean = false;

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(
      new CustomEvent("input-change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <input
        type=${this.type}
        .value=${this.value}
        placeholder=${this.placeholder}
        ?disabled=${this.disabled}
        @input=${this.handleInput}
      />
    `;
  }

  static styles = css`
    input {
      padding: 0.5em;
      font-size: 1em;
      border-radius: 4px;
      border: 1px solid var(--input-border);
      background: var(--input-bg);
      color: var(--text-color);
      width: 100%;
      box-sizing: border-box;
      transition: all 0.25s ease;
    }

    input:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-color: var(--primary-color);
    }

    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    input::placeholder {
      color: var(--text-secondary);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-input": UIInput;
  }
}
