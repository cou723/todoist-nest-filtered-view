import type { ReactiveController, ReactiveControllerHost } from "lit";

export interface FilterControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class FilterController implements ReactiveController {
  private host: FilterControllerHost;

  // 状態
  public currentQuery: string = "";

  constructor(host: FilterControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    // コントローラーがホストに接続された時の処理
  }

  hostDisconnected() {
    // 必要に応じてクリーンアップ処理
  }

  // フィルタの適用
  applyFilter(query: string): void {
    this.currentQuery = query;
    this.host.requestUpdate();
  }

  // フィルタのクリア
  clearFilter(): void {
    this.currentQuery = "";
    this.host.requestUpdate();
  }

  // 現在のクエリの取得
  getCurrentQuery(): string {
    return this.currentQuery;
  }

  // フィルタが適用されているかの確認
  hasActiveFilter(): boolean {
    return this.currentQuery.trim() !== "";
  }
}
