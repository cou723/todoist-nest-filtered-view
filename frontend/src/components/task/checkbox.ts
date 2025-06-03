import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("task-checkbox")
export class TaskCheckbox extends LitElement {
  @property({ type: String })
  private taskId!: string;

  @property({ attribute: false })
  private onComplete?: (taskId: string) => void;

  @property({ type: String })
  private checkboxTitle?: string;

  private handleChange() {
    if (this.onComplete) {
      this.onComplete(this.taskId);
    }

    // カスタムイベントも発火
    this.dispatchEvent(
      new CustomEvent("task-complete", {
        detail: { taskId: this.taskId },
        bubbles: true,
      })
    );
  }

  public render() {
    return html`
      <label class="checkbox-container">
        <input
          type="checkbox"
          class="complete-checkbox"
          @change=${this.handleChange}
          title=${this.checkboxTitle || "タスクを完了にする"}
        />
        <span class="checkmark"></span>
      </label>
    `;
  }

  public static styles = css`
    .checkbox-container {
      position: relative;
      display: inline-block;
      cursor: pointer;
      user-select: none;
      padding: 0.2em;
    }

    .complete-checkbox {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: relative;
      display: inline-block;
      height: 24px;
      width: 24px;
      background-color: var(--background-color);
      border: 2px solid var(--border-color);
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .checkbox-container:hover .checkmark {
      border-color: var(--primary-color);
      background-color: var(--primary-color-light, rgba(0, 123, 255, 0.1));
    }

    .complete-checkbox:checked ~ .checkmark {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 7px;
      top: 3px;
      width: 6px;
      height: 12px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .complete-checkbox:checked ~ .checkmark:after {
      display: block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "task-checkbox": TaskCheckbox;
  }
}
