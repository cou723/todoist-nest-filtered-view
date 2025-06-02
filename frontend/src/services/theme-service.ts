export type Theme = "light" | "dark";

export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: Theme = "light";
  private listeners: Set<(theme: Theme) => void> = new Set();

  private constructor() {
    this.initializeTheme();
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  private initializeTheme() {
    // ローカルストレージから保存されたテーマを取得
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      this.currentTheme = savedTheme;
    } else {
      // システムの設定を確認
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      this.currentTheme = prefersDark ? "dark" : "light";
    }

    this.applyTheme();

    // システムテーマの変更を監視
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          this.currentTheme = e.matches ? "dark" : "light";
          this.applyTheme();
          this.notifyListeners();
        }
      });
  }

  private applyTheme() {
    document.documentElement.setAttribute("data-theme", this.currentTheme);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentTheme));
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  setTheme(theme: Theme) {
    this.currentTheme = theme;
    localStorage.setItem("theme", theme);
    this.applyTheme();
    this.notifyListeners();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
