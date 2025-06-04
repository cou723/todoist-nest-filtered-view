import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

@customElement("task-meta-labels")
export class TaskMetaLabels extends LitElement {
  @property({ type: Array })
  public labels!: string[];

  public render() {
    return html`
      <span class="labels">
        ${repeat(
          this.labels,
          (label) => label,
          (label) => html`<span class="label">@${label}</span>`
        )}
      </span>
    `;
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
