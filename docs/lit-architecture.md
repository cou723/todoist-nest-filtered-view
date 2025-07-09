# Litアーキテクチャガイド

このドキュメントでは、Litフレームワークを使用したこのプロジェクトのアーキテクチャについて詳しく説明します。

## 目次

- [ディレクトリ構造と役割分担](#ディレクトリ構造と役割分担)
- [役割分担の詳細と責務](#役割分担の詳細と責務)
- [Litの特徴的な機能の活用例](#litの特徴的な機能の活用例)
- [状態共有パターン（Reactユーザー向け）](#状態共有パターンreactユーザー向け)

## ディレクトリ構造と役割分担

### 依存関係の階層

**依存関係の向き**: 下の層は上の層に依存する（上の層は下の層を知らない）

```
7. アプリケーション層: app-element.ts
   ↓ 依存
6. 機能パネル層: 各種パネルコンポーネント
   ↓ 依存
5. UIコンポーネント層: components/ui/, components/task/
   ↓ 依存
4. コントローラー層: controllers/（状態管理とリアクティブ制御）
   ↓ 依存
3. サービス層: services/（API通信とビジネスロジック）
   ↓ 依存
2. ユーティリティ層: utils/task-utils.ts, services/theme-service.ts
   ↓ 依存
1. 基盤層: types/, config/, styles/, utils/template-utils.ts
```

### 依存関係のルール

**✅ 許可されること**:
- 下位層が上位層をimportして使用する
- 例: `FilteredTaskController`が`TodoistService`を使用
- 例: `app-element.ts`が各種パネルコンポーネントを使用

**❌ 禁止されること**:
- 上位層が下位層を知ること
- 例: `TodoistService`が`FilteredTaskController`を参照
- 例: `types/task.ts`がUIコンポーネントを参照

**なぜこのルールが重要か**:
- **変更の影響範囲を制限**: 基盤層の変更は全体に影響するが、アプリケーション層の変更は他に影響しない
- **循環依存の防止**: 一方向の依存関係により循環依存が発生しない
- **テスタビリティ**: 上位層は下位層に依存しないため、単体テストが容易
- **再利用性**: 基盤層・ユーティリティ層は他のプロジェクトでも再利用可能

### モジュール間通信のパターン

1. **コントローラーパターン**: ReactiveControllerによる状態管理
2. **イベントベース通信**: CustomEventによる子→親の通信
3. **プロパティバインディング**: 親→子へのデータ伝達
4. **サービス注入**: 共通サービスの依存性注入

## 役割分担の詳細と責務

### 1. Services層 - データ処理とAPI通信の専門家

**最重要責務**: **外部システムとの通信とデータ変換**

Services層は「データをどう取得し、どう変換するか」に集中します。

**具体例**:
```typescript
// TodoistService - REST API v2との通信専門
export class TodoistService {
  // ✅ 良い例: API通信とキャッシュ管理
  public async fetchTasksByFilter(query?: string): Promise<Task[]> {
    // APIからデータを取得
    const response = await this.api.getTasksByFilter({ query });
    
    // キャッシュに保存
    response.results.forEach(task => {
      this.allTasksCache.set(task.id, task);
    });
    
    return response.results;
  }

  // ✅ 良い例: データ変換処理
  public async getTasksTree(query?: string): Promise<TaskNode[]> {
    const tasks = await this.fetchTasksByFilter(query);
    // TaskをTaskNodeに変換（親子関係を含む）
    return await Promise.all(
      tasks.map(task => this.fetchTaskNode(task.id))
    );
  }
}
```

**Services層がやってはいけないこと**:
```typescript
// ❌ 悪い例: UI状態を管理
export class BadTodoistService {
  public loading = false;  // UIの状態管理はControllerの責務
  public selectedTask: Task | null = null;  // UI選択状態の管理も不適切
}
```

### 2. Controllers層 - 状態管理とビジネスロジックの司令塔

**最重要責務**: **アプリケーションの状態管理とビジネスルールの実装**

Controllers層は「アプリケーションがどう振る舞うべきか」を決定します。

**具体例**:
```typescript
// FilteredTaskController - タスク管理の状態制御
export class FilteredTaskController implements ReactiveController {
  // ✅ 良い例: アプリケーション状態の管理
  public tasks: TaskNode[] = [];
  public loading = false;
  public error = "";

  // ✅ 良い例: ビジネスロジック（フィルタリング）
  public async fetchTasksByFilter(query?: string) {
    this.loading = true;
    this.error = "";
    this.host.requestUpdate();

    try {
      // Serviceを使ってデータを取得
      this.tasks = await this.todoistService.getTasksTree(query);
      
      // ビジネスルール: 依存関係を考慮したソート
      this.tasks = sortTasksByPriority(this.tasks);
    } catch (error) {
      this.error = `タスクの取得に失敗: ${error.message}`;
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }

  // ✅ 良い例: ユーザー操作のビジネスロジック
  public async completeTask(taskId: string) {
    // 楽観的更新（すぐにUIに反映）
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.tasks.splice(taskIndex, 1);
      this.host.requestUpdate();
    }

    try {
      await this.todoistService.completeTask(taskId);
    } catch (error) {
      // エラー時は元に戻す
      await this.fetchTasksByFilter();
    }
  }
}
```

**Controllers層がやってはいけないこと**:
```typescript
// ❌ 悪い例: 直接API呼び出し
export class BadController {
  public async fetchTasks() {
    // Serviceを使わず直接API呼び出し（責務の境界違反）
    const response = await fetch('/api/tasks');
    return response.json();
  }
}
```

### 3. Components/UI層 - ユーザーインターフェースの表現者

**最重要責務**: **データの表示とユーザー操作の受付**

Components層は「ユーザーに何を見せ、どう操作させるか」のみに集中します。

**具体例**:
```typescript
// task-list.ts - UI表示とイベント中継専門
@customElement("task-list")
export class TaskList extends LitElement {
  @property({ type: Array })
  private tasks: TaskNode[] = [];

  @property({ attribute: false })
  private onCompleteTask?: (taskId: string) => void;

  // ✅ 良い例: データの表示に特化
  public render() {
    if (this.loading) {
      return html`<div class="loading">読み込み中...</div>`;
    }

    return html`
      <ul class="task-list">
        ${repeat(this.tasks, task => task.id, task => html`
          <task-item 
            .task=${task}
            @task-complete=${(e: CustomEvent) => 
              this.handleTaskComplete(e.detail.taskId)
            }
          ></task-item>
        `)}
      </ul>
    `;
  }

  // ✅ 良い例: イベントの中継のみ
  private handleTaskComplete(taskId: string) {
    // ビジネスロジックは実装せず、Controllerに委譲
    this.onCompleteTask?.(taskId);
  }
}

// task-item.ts - 個別タスクの表示専門
@customElement("task-item")
export class TaskItem extends LitElement {
  @property({ type: Object })
  public task!: TaskNode;

  // ✅ 良い例: 表示ロジックのみ
  public render() {
    return html`
      <li class="task-item ${this.getTaskClasses()}">
        <task-checkbox 
          .checked=${false}
          @change=${this.handleToggle}
        ></task-checkbox>
        <task-content .content=${this.task.content}></task-content>
        <task-meta .task=${this.task}></task-meta>
        ${this.renderParentInfo()}
      </li>
    `;
  }

  // ✅ 良い例: 表示用のCSSクラス決定
  private getTaskClasses(): string {
    const classes = [`priority-${this.task.priority}`];
    if (this.task.due?.isOverdue) classes.push('overdue');
    return classes.join(' ');
  }

  // ✅ 良い例: イベント発行のみ
  private handleToggle() {
    this.dispatchEvent(new CustomEvent('task-complete', {
      detail: { taskId: this.task.id },
      bubbles: true
    }));
  }
}
```

**Components層がやってはいけないこと**:
```typescript
// ❌ 悪い例: ビジネスロジックの実装
@customElement("bad-task-item")
export class BadTaskItem extends LitElement {
  private async handleToggle() {
    // コンポーネントが直接API呼び出し（責務違反）
    try {
      await fetch(`/api/tasks/${this.task.id}/complete`, {method: 'POST'});
      // 他のタスクの状態も更新（責務違反）
      this.updateOtherTasks();
    } catch (error) {
      // エラーハンドリングもController/Serviceの責務
      this.showErrorDialog(error);
    }
  }
}
```

### 4. 実際の連携例

**タスク完了の処理フロー**:
```typescript
// 1. UI層: ユーザー操作を受け取り、イベント発行
// task-item.ts
private handleToggle() {
  this.dispatchEvent(new CustomEvent('task-complete', {
    detail: { taskId: this.task.id }
  }));
}

// 2. Controller層: ビジネスロジックを実行
// filtered-task-controller.ts
public async completeTask(taskId: string) {
  // 楽観的更新
  this.removeTaskFromList(taskId);
  this.host.requestUpdate();
  
  try {
    // Serviceに処理を委譲
    await this.todoistService.completeTask(taskId);
  } catch (error) {
    // エラー時の復旧処理
    await this.fetchTasksByFilter();
  }
}

// 3. Service層: 外部APIとの通信
// todoist-service.ts
public async completeTask(taskId: string): Promise<void> {
  await this.api.closeTask(taskId);
  // キャッシュからも削除
  this.allTasksCache.delete(taskId);
}
```

### 責務分担の利点

1. **保守性**: 各層の責任が明確で、変更の影響範囲が限定される
2. **テスタビリティ**: 各層を独立してテスト可能
3. **再利用性**: UIコンポーネントは異なるControllerと組み合わせ可能
4. **拡張性**: 新機能追加時も既存の構造を活用できる

## Litの特徴的な機能の活用例

### Shadow DOMによる スタイルの隔離

```typescript
public static styles = css`
  .task-item {
    padding: 1rem;
    border: 1px solid var(--border-color);
  }
`;
```

### ディレクティブの活用

- **`repeat`**: 効率的なリスト描画
- **`when`**: 条件付きレンダリング
- **`ref`**: DOM要素への参照取得

### CSS変数によるテーマシステム

```typescript
// テーマ切り替えでCSSカスタムプロパティを動的変更
document.documentElement.style.setProperty('--bg-color', isDark ? '#1a1a1a' : '#ffffff');
```

## 状態共有パターン（Reactユーザー向け）

Reactの`useContext`や`Provider`パターンに相当する機能をLitで実現する方法と、このコードベースでの実装例を説明します。

### React vs Lit の状態共有比較

| React                        | Lit                           | このコードベースでの使用例 |
| ---------------------------- | ----------------------------- | -------------------------- |
| `createContext` + `Provider` | Singleton + Observer パターン | `ThemeService`             |
| `useContext`                 | ReactiveController            | `theme-toggle.ts`での使用  |
| カスタムフック               | カスタムController            | 各パネルのController群     |

### 1. React Context → Lit Singleton パターン

**React での実装**:
```typescript
// React
const ThemeContext = createContext();

function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <ThemeToggle />
      <TaskList />
    </ThemeContext.Provider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
    {theme === 'light' ? '🌙' : '☀️'}
  </button>;
}
```

**Lit での実装**（このコードベースの実際の例）:
```typescript
// services/theme-service.ts - Context相当
export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: Theme = "light";
  private listeners: Set<(theme: Theme) => void> = new Set();

  public static getInstance(): ThemeService {
    // Singleton パターンでグローバル状態を管理
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  // useContext + setState相当
  public subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }
}

// components/ui/theme-toggle.ts - useContext相当
@customElement("theme-toggle")
export class ThemeToggle extends LitElement {
  @state()
  private currentTheme: Theme = "light";

  private themeService = ThemeService.getInstance(); // useContext相当
  private unsubscribe?: () => void;

  public connectedCallback() {
    super.connectedCallback();
    // 初期値を取得
    this.currentTheme = this.themeService.getTheme();
    
    // 状態変更を購読（useEffect + useContext相当）
    this.unsubscribe = this.themeService.subscribe((theme) => {
      this.currentTheme = theme; // setState相当
    });
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.(); // クリーンアップ（useEffect return相当）
  }

  public render() {
    const isDark = this.currentTheme === "dark";
    return html`
      <button @click=${() => this.themeService.toggleTheme()}>
        ${isDark ? "☀️" : "🌙"}
      </button>
    `;
  }
}
```

### 2. カスタムフック → ReactiveController パターン

**React カスタムフック**:
```typescript
// React
function useFilteredTasks(query) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchTasks(query)
      .then(setTasks)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [query]);

  return { tasks, loading, error };
}
```

**Lit ReactiveController**（このコードベースの実際の例）:
```typescript
// controllers/filtered-task-controller.ts - カスタムフック相当
export class FilteredTaskController implements ReactiveController {
  private host: FilteredTaskControllerHost;
  
  // useState相当の状態管理
  public tasks: TaskNode[] = [];
  public loading = false;
  public error = "";

  constructor(host: FilteredTaskControllerHost) {
    this.host = host;
    host.addController(this); // フック登録相当
  }

  // useEffect相当のライフサイクル
  public hostConnected() {
    // コンポーネントマウント時の処理
  }

  public hostDisconnected() {
    // クリーンアップ処理（useEffect return相当）
    this.abortController?.abort();
  }

  // カスタムフックのロジック相当
  public async fetchTasksByFilter(query?: string) {
    this.loading = true;
    this.error = "";
    this.host.requestUpdate(); // setState相当

    try {
      this.tasks = await this.todoistService.getTasksTree(query);
    } catch (error) {
      this.error = `タスクの取得に失敗: ${error.message}`;
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }
}

// components/filtered-nested-tasks-panel.ts - フック使用側
@customElement("filtered-nested-tasks-panel")
export class FilteredNestedTasksPanel extends LitElement {
  // カスタムフック相当の使用
  private filteredTaskController = new FilteredTaskController(this);
  private filterController = new FilterController(this);

  public render() {
    return html`
      <task-list
        .tasks=${this.filteredTaskController.tasks}
        .loading=${this.filteredTaskController.loading}
        .error=${this.filteredTaskController.error}
      ></task-list>
    `;
  }
}
```

### 3. このコードベースでの状態共有の実装箇所

#### グローバル状態管理（Context相当）
- **`ThemeService`** (`services/theme-service.ts`): テーマ状態の全体共有
  - 使用箇所: `theme-toggle.ts`, `app-element.ts`
  - React Context + Provider パターンと同等

#### ローカル状態管理（カスタムフック相当）
- **`AuthController`** (`controllers/auth-controller.ts`): 認証状態管理
- **`FilteredTaskController`** (`controllers/filtered-task-controller.ts`): タスク一覧状態
- **`GoalMilestoneController`** (`controllers/goal-milestone-controller.ts`): ゴール統計状態
- **`DateGoalController`** (`controllers/date-goal-controller.ts`): 日付ゴール状態
- **`TaskDailyCompletionController`** (`controllers/task-daily-completion-controller.ts`): 完了統計状態

#### パターンの使い分け
```typescript
// グローバル状態（Singletonパターン）
const themeService = ThemeService.getInstance(); // どこでも同じインスタンス

// ローカル状態（Controllerパターン）
private taskController = new FilteredTaskController(this); // コンポーネント固有
```

### 4. React開発者向けの移行ガイド

| Reactパターン                          | Litパターン                      | 実装場所            |
| -------------------------------------- | -------------------------------- | ------------------- |
| `const [state, setState] = useState()` | `@state() private state = value` | 各コンポーネント    |
| `useEffect(() => {}, [deps])`          | `updated(changedProperties)`     | 各コンポーネント    |
| `createContext() + Provider`           | `Singleton + Observer`           | `ThemeService`      |
| `useContext(Context)`                  | `Service.getInstance()`          | `theme-toggle.ts`   |
| `useCallback, useMemo`                 | クラスメソッド + プロパティ      | 各Controller        |
| カスタムフック                         | `ReactiveController`             | `controllers/` 配下 |

### 5. メリット・デメリット

**Lit Singleton + Observer パターンの利点**:
- **型安全性**: TypeScriptとの統合が優秀
- **パフォーマンス**: 必要最小限の再レンダリング
- **メモリ効率**: Singletonによるインスタンス共有
- **ライフサイクル管理**: connectedCallback/disconnectedCallbackでのクリーンアップ

**注意点**:
- **学習コスト**: Reactとは異なるパターンの習得が必要
- **デバッグ**: React DevToolsのような専用ツールが少ない