# フロントエンド認証設計：access_token 直接入力方式

## 背景

React 版フロントエンド（`frontend-react`）の認証方式を、OAuth コードフローから **Todoist access_token 直接入力方式** に変更します。

### 変更理由

1. **シンプルさ**: OAuth プロキシの維持・運用コストを削減
2. **開発効率**: ローカル開発やデバッグが容易
3. **透明性**: ユーザーが自分のトークンを完全に管理可能
4. **セキュリティ**: クライアントシークレットの管理が不要

## 設計方針

### 認証フロー

```
1. 未認証状態
   ↓
2. ユーザーが Todoist access_token を入力フォームから入力
   ↓
3. トークンを localStorage の "todoist_token" キーに保存
   ↓
4. 認証済み状態（各パネル表示）
   ↓
5. ログアウト時は localStorage からトークンを削除
```

### localStorage キー

- **`todoist_token`**: Todoist API アクセストークン（必須）
- **削除されるキー**:
  - `oauth_state`: OAuth CSRF 保護用（不要になる）
  - `todoist_token_expires_at`: トークン有効期限（不要になる）

## AuthService の変更

### 削除・非推奨化するメソッド

以下の OAuth コードフロー専用メソッドを削除または非推奨化します：

- `generateAuthUrl()`: OAuth 認可 URL 生成
- `exchangeCode()`: 認可コードをトークンと交換
- `validateState()`: CSRF state 検証

### 保持するメソッド

以下のメソッドは access_token 直接入力方式でも必要なため保持します：

- `saveToken(token: string)`: トークンを localStorage に保存
- `getToken()`: localStorage からトークンを取得
- `removeToken()`: localStorage からトークンを削除
- `isAuthenticated()`: 認証状態を確認（localStorage にトークンが存在するかチェック）

### 新しい AuthService インターフェース

```typescript
export interface IAuthService {
  /**
   * トークンを localStorage に保存
   */
  readonly saveToken: (token: string) => Effect.Effect<void, never>;

  /**
   * localStorage からトークンを取得
   */
  readonly getToken: () => Effect.Effect<Option.Option<string>, never>;

  /**
   * localStorage からトークンを削除
   */
  readonly removeToken: () => Effect.Effect<void, never>;

  /**
   * 認証状態を確認
   */
  readonly isAuthenticated: () => Effect.Effect<boolean, never>;
}
```

## TodoistService/StatsService の認証連携

TodoistService と StatsService は、AuthService を直接参照せず、HTTP クライアントに設定されたトークンを使用します。

### 現在の設計（Phase 2）

```typescript
// HTTP クライアント作成時にトークンを渡す
const createTodoistClient = (token: string) =>
  Layer.provide(
    TodoistHttpClientLive({
      baseUrl: "https://api.todoist.com/rest/v2",
      token,
    }),
    FetchHttpClient.layer,
  );
```

### Phase 2.5 での変更点

HTTP クライアントの作成タイミングで、AuthService から取得したトークンを渡す構造は維持します。
アプリケーション起動時に：

1. AuthService.getToken() でトークンを取得
2. トークンが存在すれば、それを使って TodoistHttpClient を初期化
3. トークンが存在しなければ、未認証 UI を表示

## UI の変更

### 未認証状態

- 「Todoist access_token を入力してください」というガイダンスを表示
- トークン入力フォーム（テキスト入力またはパスワード入力）
- 「保存」ボタン
- 各パネル（タスク一覧、統計など）は非表示

### 認証済み状態

- 通常の UI を表示（全パネル）
- ヘッダーに「ログアウト」ボタンを配置
- 必要に応じてトークンの一部（最後の4文字など）を表示

### トークン取得方法の案内

UI に以下のガイダンスを表示：

```
Todoist API トークンの取得方法:
1. https://todoist.com/app/settings/integrations/developer にアクセス
2. "API token" セクションでトークンをコピー
3. 下のフォームに貼り付けて保存
```

## セキュリティ考慮事項

### トークンの保存

- localStorage に平文で保存（ブラウザの標準的な方法）
- HTTPS 通信を前提とする
- XSS 対策として Content Security Policy を設定

### トークンの漏洩リスク

- ユーザー自身がトークンを管理するため、セキュリティ意識が必要
- UI でトークンを表示する場合は、マスクまたは一部のみ表示
- ログアウト機能を明示的に提供

### トークンの有効期限

- Todoist API トークンは基本的に無期限（ユーザーが手動で無効化するまで）
- 401 エラーが発生した場合は、トークンが無効化されたと判断し、再入力を促す

## 実装の段階的アプローチ

### Phase 2.5（本 issue）

1. AuthService のリファクタリング
   - OAuth コードフロー関連メソッドの削除
   - 既存のトークン管理メソッドの整理
2. OAuthConfig、OAuthTokenResponse など OAuth 専用型の削除
3. ドキュメント（本ファイル）の作成

### Phase 4（Issue #17）

1. 未認証状態 UI の実装
2. トークン入力フォームの実装
3. 認証済み状態 UI の実装
4. ログアウト機能の実装
5. AuthContext と各サービスの連携実装

## 参考

- [Todoist REST API - Authorization](https://developer.todoist.com/rest/v2/#authorization)
- Lit 版の認証実装: `frontend-lit-legacy/src/controllers/auth-controller.ts`
- Issue #29: FE: フェーズ2.5 認証基盤の再設計（access_token 直接入力対応）
- Issue #17: FE: フェーズ4 認証フロー実装
