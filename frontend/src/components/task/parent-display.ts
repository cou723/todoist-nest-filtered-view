import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { TaskNode } from "../../types/task.js";

@customElement("parent-task-display")
export class ParentTaskDisplay extends LitElement {
  @property({ type: Array })
  public ancestorChain: TaskNode[] = [];

  private openTaskInTodoist(taskId: string): void {
    window.open(
      `https://todoist.com/showTask?id=${taskId}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  public render() {
    if (this.ancestorChain.length === 0) {
      return html``;
    }

    return html`<div class="parent-task">
      ${this.ancestorChain.map((ancestor, index) => html`
        <span
          class="parent-task-link"
          @click=${() => this.openTaskInTodoist(ancestor.id)}
        >
          ${ancestor.content}
        </span>
        ${index < this.ancestorChain.length - 1 
          ? html`<span class="separator"> > </span>` 
          : ''
        }
      `)}
    </div>`;
  }

  public static styles = css`
    .parent-task {
      font-size: 0.8em;
      color: var(--text-secondary);
      font-style: italic;
      margin-bottom: 0.2em;
    }

    .parent-task-link {
      color: var(--primary-color);
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .parent-task-link:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .separator {
      color: var(--text-secondary);
      margin: 0 0.2em;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "parent-task-display": ParentTaskDisplay;
  }
}
