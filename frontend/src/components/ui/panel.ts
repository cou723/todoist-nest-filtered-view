import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("ui-panel")
export class Panel extends LitElement {
  public connectedCallback() {}

  public render() {
    return html` <slot></slot>`;
  }

  public static styles = css`
    :host {
      margin: 1rem;
      padding: 1rem;
      text-align: center;
      display: block;
      background: var(--card-bg);
      border-radius: 8px;
      box-shadow: 0 2px 8px var(--card-shadow);
      color: var(--text-color);
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-panel": Panel;
  }
}
