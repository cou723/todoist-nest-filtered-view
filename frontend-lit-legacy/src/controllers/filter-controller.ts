import type { ReactiveController, ReactiveControllerHost } from "lit";

export interface FilterControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class FilterController implements ReactiveController {
  private host: FilterControllerHost;

  // 状態
  public currentQuery = "";
  public hideDepTodos = false;

  constructor(host: FilterControllerHost) {
    this.host = host;
    host.addController(this);
  }

  public hostConnected() {
    const savedQuery = localStorage.getItem("todoist_filter_query") || "";
    const savedHideDep = localStorage.getItem("todoist_hide_dep_todos") === "true";
    this.applyFilter(savedQuery, savedHideDep);
  }

  public hostDisconnected() {
    // 必要に応じてクリーンアップ処理
  }

  // フィルタの適用
  public applyFilter(query: string, hideDepTodos?: boolean): void {
    this.currentQuery = query;
    if (hideDepTodos !== undefined) {
      this.hideDepTodos = hideDepTodos;
    }
    this.host.requestUpdate();
  }

  // フィルタのクリア
  public clearFilter(): void {
    this.currentQuery = "";
    this.hideDepTodos = false;
    this.host.requestUpdate();
  }

  // 現在のクエリの取得
  public getCurrentQuery(): string {
    return this.currentQuery;
  }

  // dep非表示設定の取得
  public getHideDepTodos(): boolean {
    return this.hideDepTodos;
  }

  // フィルタが適用されているかの確認
  public hasActiveFilter(): boolean {
    return this.currentQuery.trim() !== "" || this.hideDepTodos;
  }
}
