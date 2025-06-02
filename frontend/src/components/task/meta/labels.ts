import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { when } from "../../../utils/template-utils.js";

@customElement("task-meta-labels")
export class TaskMetaLabels extends LitElement {
  @property({ type: Array })
  labels?: string[];

  render() {
    return when(
      this.labels && this.labels.length > 0,
      html`<span class="labels"
        >${this.labels!.map((s) => "@" + s).join(" ")}</span
      >`
    );
  }

  static styles = css`
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
