# アーキテクチャパターンと設計指針

## Litベースのフロントエンドアーキテクチャ

### Reactive Controllerパターン
- 状態管理にLitのReactive Controllerを採用
- ビジネスロジック（Controller）とUI（Component）の分離
- 各パネルが独自のコントローラーを持つ独立設計

### コンポーネント階層設計
```
app-element (アプリケーション層)
├── auth-button, theme-toggle (認証・UI制御)
├── filtered-nested-todos-panel (メイン機能)
├── goal-milestone-panel (統計表示)
├── date-goal-panel (期限監視)
└── todo-daily-completion-panel (完了統計)
```

### 責務分離の原則
- **Services層**: 外部システムとの通信とデータ変換
- **Controllers層**: アプリケーションの状態管理とビジネスルール実装
- **Components/UI層**: データの表示とユーザー操作の受付

## データフロー設計

### 単方向データフロー
```
External APIs → Services → Controllers → Components → UI
     ↑                                      ↓
   OAuth        Theme Service          Event Handlers
```

### キャッシュ戦略
- **TodoistService**: 5分間のAPIレスポンスキャッシュ
- **TodoistSyncService**: Sync API専用キャッシュ
- **TodoService (Cron)**: 5分間のラベル別キャッシュ

## サービス層の設計パターン

### API統合パターン
1. **TodoistService**: REST API v2をラップ
   - `@doist/todoist-api-typescript`クライアント使用
   - 親タスク取得による階層構造構築
   - インテリジェントキャッシュ処理

2. **TodoistSyncService**: Sync API v9直接実装
   - 完了済みタスク履歴の取得
   - 独自型定義とバリデーション（valibot）
   - ラベル抽出機能

3. **OAuthService**: 認証プロキシ統合
   - 安全なトークン交換
   - localStorage による永続化

### エラーハンドリング設計
- 実行時型チェックとバリデーション
- エラー時の適切な例外処理
- デフォルト値による隠蔽を排除

## 型安全設計

### TypeScript活用
- 厳密な型チェック（`strict: true`）
- インターフェースによる契約定義
- 型推論の積極活用
- `any`の最小限使用

### 実行時バリデーション
- valibotによるAPIレスポンス検証
- 厳密なスキーマ定義
- バリデーション失敗時の正しいエラー処理

## パフォーマンス設計

### スケーラビリティ考慮
- 中規模タスク数（〜500件）想定
- 全ページ取得による完全フィルタ機能
- 大量データ時の仮想化実装検討

### API効率化
- ラベルフィルタによる必要データのみ取得
- インメモリキャッシュによる重複API回避
- タスク変更時の自動キャッシュクリア

## 設計の進化履歴

### v1.0 → v2.0: コンポーネント分離
- **TaskController** → **FilteredTaskController**（役割明確化）
- パネルコンポーネント化による責務分離
- app-element簡素化（認証とパネル統合のみ）

### 設計決定の背景記録
- **なぜSync API直接実装?**: REST APIが完了履歴未サポート
- **なぜコントローラーパターン?**: 状態管理とUI描画の分離
- **なぜプロキシサーバー?**: CORS問題とクライアントシークレット保護

## 開発ガイドライン

### 新機能追加時の考慮点
1. 既存コントローラーパターンの踏襲
2. 独立したパネルコンポーネントとしての設計
3. 適切なサービス層の選択・拡張
4. 型安全性とエラーハンドリングの実装

### 制約と注意点
- Lit Web Componentsの制約理解
- Reactive Controllerライフサイクル管理
- キャッシュ無効化タイミングの考慮
- ブラウザ互換性（モダンブラウザ前提）