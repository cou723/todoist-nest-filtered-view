import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("todo-checkbox")
export class TodoCheckBox extends LitElement {
  @property({ type: String })
  private todoId!: string;

  @property({ attribute: false })
  private onComplete?: (todoId: string) => void;

  @property({ type: String })
  private checkboxTitle?: string;

  private handleChange() {
    console.log("[TodoCheckBox] タスク完了処理開始:", {
      todoId: this.todoId,
      todoIdType: typeof this.todoId,
      onComplete: !!this.onComplete
    });

    if (!this.todoId) {
      console.error("[TodoCheckBox] エラー: todoIdがundefinedまたは空です");
      return;
    }

    if (this.onComplete) {
      this.onComplete(this.todoId);
    }

    // カスタムイベントも発火
    this.dispatchEvent(
      new CustomEvent("todo-complete", {
        detail: { todoId: this.todoId },
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
    "todo-checkbox": TodoCheckBox;
  }
}
