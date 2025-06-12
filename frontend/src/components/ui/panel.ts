import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { resetCss } from "../../styles/reset";

@customElement("ui-panel")
export class UiPanel extends LitElement {
  public render() {
    return html`<div><slot></slot></div>`;
  }

  public static styles = [
    resetCss,
    css`
      div {
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
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ui-panel": UiPanel;
  }
}
