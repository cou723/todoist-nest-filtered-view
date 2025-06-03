import type { ReactiveController, ReactiveControllerHost } from "lit";

export interface FilterControllerHost extends ReactiveControllerHost {
  requestUpdate(): void;
}

export class FilterController implements ReactiveController {
  private host: FilterControllerHost;

  // 状態
  public currentQuery = "";

  constructor(host: FilterControllerHost) {
    this.host = host;
    host.addController(this);
  }

  public hostConnected() {
    // コントローラーがホストに接続された時の処理
  }

  public hostDisconnected() {
    // 必要に応じてクリーンアップ処理
  }

  // フィルタの適用
  public applyFilter(query: string): void {
    this.currentQuery = query;
    this.host.requestUpdate();
  }

  // フィルタのクリア
  public clearFilter(): void {
    this.currentQuery = "";
    this.host.requestUpdate();
  }

  // 現在のクエリの取得
  public getCurrentQuery(): string {
    return this.currentQuery;
  }

  // フィルタが適用されているかの確認
  public hasActiveFilter(): boolean {
    return this.currentQuery.trim() !== "";
  }
}
