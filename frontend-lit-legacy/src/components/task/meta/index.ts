import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./priority.js";
import "./due-date.js";
import "./labels.js";
import { when } from "../../../utils/template-utils.js";

@customElement("todo-meta")
export class TodoMeta extends LitElement {
  @property({ type: Number })
  public priority!: number;

  @property({ type: Object })
  public due?: { date: string; datetime?: string | null };

  @property({ type: Array })
  public labels?: string[];

  public render() {
    return html`
      <div class="todo-meta">
        <todo-meta-priority .priority=${this.priority}></todo-meta-priority>

        ${when(
          this.due,
          (due) => html`<todo-meta-due-date .due=${due}></todo-meta-due-date>`
        )}
        ${when(
          this.labels,
          (labels) =>
            html`<todo-meta-labels .labels=${labels}></todo-meta-labels>`
        )}
      </div>
    `;
  }

  public static styles = css`
    .todo-meta {
      margin-top: 0.2em;
      padding-left: 0.5em;
      font-size: 0.8em;
      color: var(--text-secondary);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "todo-meta": TodoMeta;
  }
}
