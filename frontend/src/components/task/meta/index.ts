import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./priority.js";
import "./due-date.js";
import "./labels.js";

@customElement("task-meta")
export class TaskMeta extends LitElement {
  @property({ type: Number })
  public priority!: number;

  @property({ type: Object })
  public due!: { date: string; datetime?: string | null };

  @property({ type: Array })
  public labels?: string[];

  public render() {
    return html`
      <div class="task-meta">
        <task-meta-priority .priority=${this.priority}></task-meta-priority>
        <task-meta-due-date .due=${this.due}></task-meta-due-date>
        <task-meta-labels .labels=${this.labels}></task-meta-labels>
      </div>
    `;
  }

  public static styles = css`
    .task-meta {
      margin-top: 0.2em;
      padding-left: 0.5em;
      font-size: 0.8em;
      color: var(--text-secondary);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-meta": TaskMeta;
  }
}
