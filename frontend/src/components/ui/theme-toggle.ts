import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ThemeService, type Theme } from "../../services/theme-service.js";

@customElement("theme-toggle")
export class ThemeToggle extends LitElement {
  @state()
  private currentTheme: Theme = "light";

  private themeService = ThemeService.getInstance();
  private unsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.currentTheme = this.themeService.getTheme();
    this.unsubscribe = this.themeService.subscribe((theme) => {
      this.currentTheme = theme;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private handleToggle() {
    this.themeService.toggleTheme();
  }

  render() {
    const isDark = this.currentTheme === "dark";
    return html`
      <button
        @click=${this.handleToggle}
        aria-label=${isDark
          ? "ライトモードに切り替え"
          : "ダークモードに切り替え"}
        title=${isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      >
        ${isDark ? "☀️" : "🌙"}
      </button>
    `;
  }

  static styles = css`
    button {
      padding: 0.5rem;
      font-size: 1.2rem;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--button-bg);
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
    }

    button:hover {
      background: var(--button-hover-bg);
      border-color: var(--primary-color);
      transform: scale(1.05);
    }

    button:focus,
    button:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    button:active {
      transform: scale(0.95);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "theme-toggle": ThemeToggle;
  }
}
