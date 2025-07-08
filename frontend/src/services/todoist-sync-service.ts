import * as v from "valibot";

/**
 * TodoistSyncService - Todoist Sync APIを使用した完了済みタスク取得
 *
 * Sync APIを使用することで、完了済みタスクの履歴データを日付範囲で取得できます
 */
export class TodoistSyncService {
  private token: string;
  private baseUrl = "https://api.todoist.com/sync/v9";

  constructor(token: string) {
    this.token = token;
  }

  /**
   * 完了済みタスクを日付範囲で取得
   * @param since 開始日時 (ISO 8601形式)
   * @param until 終了日時 (ISO 8601形式)
   * @returns 完了済みタスクの配列
   */
  public async getCompletedTasks(
    since?: string,
    until?: string
  ): Promise<CompletedTask[]> {
    // Sync API v9の完了済みタスク専用エンドポイントを使用
    const url = new URL(`${this.baseUrl}/completed/get_all`);
    
    // クエリパラメータを追加
    if (since) url.searchParams.append('since', since);
    if (until) url.searchParams.append('until', until);
    url.searchParams.append('limit', '200'); // 最大200件取得

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`完了済みタスクの取得に失敗しました: ${response.status}`);
    }

    const data = await response.json();
    
    // completed/get_allエンドポイントからは直接完了済みタスクが返される
    const completedItems = data.items || [];
    
    // APIレスポンスをバリデーション
    const validatedData = v.parse(CompletedTasksResponseSchema, { items: completedItems });
    
    // バリデーション成功後に、各アイテムにコンテンツから抽出したラベルを追加
    const enrichedItems: CompletedTask[] = validatedData.items.map((item) => {
      const extractedLabels = this.extractLabelsFromContent(item.content);
      
      return {
        ...item,
        labels: extractedLabels, // コンテンツから抽出したラベルのみを使用
      };
    });

    return enrichedItems;
  }

  /**
   * @taskラベルが付いた完了済みタスクのみを取得
   * @param since 開始日時 (ISO 8601形式)
   * @param until 終了日時 (ISO 8601形式)
   * @returns @taskラベルが付いた完了済みタスクの配列
   */
  /**
   * タスクコンテンツから@で始まるラベルを抽出
   * @param content タスクのコンテンツ
   * @returns 抽出されたラベルの配列
   */
  private extractLabelsFromContent(content: string): string[] {
    const labelRegex = /@(\w+)/g;
    const labels: string[] = [];
    let match;
    
    while ((match = labelRegex.exec(content)) !== null) {
      labels.push(match[1]); // @を除いたラベル名を追加
    }
    
    return labels;
  }

  public async getCompletedTasksWithTaskLabel(
    since?: string,
    until?: string
  ): Promise<CompletedTask[]> {
    const allCompletedTasks = await this.getCompletedTasks(since, until);

    const filteredTasks = allCompletedTasks.filter((task) => {
      return task.labels.includes("task");
    });
    
    return filteredTasks;
  }

  /**
   * 日付別の@taskタスク完了統計を取得
   * @param days 過去何日分のデータを取得するか
   * @returns 日付別の完了タスク数
   */
  public async getDailyCompletionStats(
    days: number = 30
  ): Promise<DailyCompletionStat[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const since = startDate.toISOString();
    const until = endDate.toISOString();

    const completedTasks = await this.getCompletedTasksWithTaskLabel(
      since,
      until
    );

    const dailyStats = new Map<string, number>();

    completedTasks.forEach((task) => {
      const completedDate = new Date(task.completed_at);
      const dateKey = completedDate.toISOString().split("T")[0];

      dailyStats.set(dateKey, (dailyStats.get(dateKey) || 0) + 1);
    });

    const result: DailyCompletionStat[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];

      const stat = {
        date: dateKey,
        count: dailyStats.get(dateKey) || 0,
        displayDate: date.toLocaleDateString("ja-JP", {
          month: "numeric",
          day: "numeric",
        }),
      };

      try {
        const validatedStat = v.parse(DailyCompletionStatSchema, stat);
        result.push(validatedStat);
      } catch (error) {
        if (error instanceof v.ValiError) {
          throw new Error(`統計データの生成に失敗しました: ${error.message}`);
        }
        throw error;
      }
    }

    return result;
  }
}

// Sync APIの実際のレスポンス構造に基づくバリデーションスキーマ
// 注意: @doist/todoist-api-typescriptライブラリには完了済みタスクの型定義が存在しないため、
// Sync API v9のレスポンス構造を元に独自に定義

// Sync APIの実際のレスポンス構造に基づく厳密なスキーマ
// completed/get_allエンドポイントではlabelsフィールドは提供されない
const CompletedTaskSchema = v.object({
  id: v.string("タスクIDは文字列である必要があります"),
  completed_at: v.string("完了日時は文字列である必要があります"),
  content: v.string("タスクコンテンツは文字列である必要があります"),
  project_id: v.string("プロジェクトIDは文字列である必要があります"),
  user_id: v.string("ユーザーIDは文字列である必要があります"),
  // labelsフィールドは削除 - APIから提供されないため
});

const CompletedTasksResponseSchema = v.object({
  items: v.array(CompletedTaskSchema, "完了済みタスクの配列である必要があります"),
});

const DailyCompletionStatSchema = v.object({
  date: v.pipe(
    v.string("日付は文字列である必要があります"),
    v.isoDate("日付はISO 8601形式である必要があります")
  ),
  count: v.pipe(
    v.number("カウントは数値である必要があります"),
    v.minValue(0, "カウントは0以上である必要があります")
  ),
  displayDate: v.string("表示用日付は文字列である必要があります"),
});

// 型定義（バリデーションスキーマから生成）
// APIレスポンスの基本型
type ApiCompletedTask = v.InferOutput<typeof CompletedTaskSchema>;

// アプリケーション内で使用する拡張型（ラベル抽出後）
export interface CompletedTask extends ApiCompletedTask {
  labels: string[]; // コンテンツから抽出されたラベル
}

export type CompletedTasksResponse = v.InferOutput<typeof CompletedTasksResponseSchema>;
export type DailyCompletionStat = v.InferOutput<typeof DailyCompletionStatSchema>;
