import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("task-meta-labels")
export class TaskMetaLabels extends LitElement {
  @property({ type: Array })
  public labels!: string[];

  public render() {
    return html`<span class="labels"
      >${this.labels.map((s) => "@" + s).join(" ")}</span
    >`;
  }

  public static styles = css`
    .labels {
      color: var(--primary-color);
      font-style: italic;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-meta-labels": TaskMetaLabels;
  }
}
