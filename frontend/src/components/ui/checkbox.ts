import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-checkbox")
export class UICheckbox extends LitElement {
  @property({ type: Boolean })
  public checked = false;

  @property({ type: String })
  public label = "";

  @property({ type: String })
  public id = "";

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;

    this.dispatchEvent(
      new CustomEvent("checkbox-change", {
        detail: { checked: this.checked, id: this.id },
        bubbles: true,
        composed: true,
      })
    );
  }

  public render() {
    return html`
      <label class="checkbox-container">
        <input
          type="checkbox"
          class="checkbox-input"
          .checked=${this.checked}
          @change=${this.handleChange}
          id=${this.id}
        />
        <span class="checkmark"></span>
        <span class="label-text">${this.label}</span>
      </label>
    `;
  }

  public static styles = css`
    .checkbox-container {
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      gap: 0.5rem;
    }

    .checkbox-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: relative;
      display: inline-block;
      height: 18px;
      width: 18px;
      background-color: var(--background-color);
      border: 2px solid var(--border-color);
      border-radius: 3px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .checkbox-container:hover .checkmark {
      border-color: var(--primary-color);
      background-color: var(--primary-color-light, rgba(0, 123, 255, 0.1));
    }

    .checkbox-input:checked ~ .checkmark {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-input:checked ~ .checkmark:after {
      display: block;
    }

    .label-text {
      color: var(--text-color);
      font-size: 0.9rem;
      line-height: 1.4;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-checkbox": UICheckbox;
  }
}