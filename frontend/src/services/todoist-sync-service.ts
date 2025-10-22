import * as v from "valibot";
import { startOfDay, addDays, format, subDays } from "date-fns";

/**
 * TodoistSyncService - Todoist Sync APIを使用した完了済みTodo取得
 *
 * Sync APIを使用することで、完了済みTodoの履歴データを日付範囲で取得できます
 */
export class TodoistSyncService {
  private token: string;
  private baseUrl = "https://api.todoist.com/sync/v9";

  constructor(token: string) {
    this.token = token;
  }

  /**
   * 完了済みTodoを日付範囲で取得
   * @param since 開始日時 (ISO 8601形式)
   * @param until 終了日時 (ISO 8601形式)
   * @returns 完了済みTodoの配列
   */
  public async getCompletedTasks(
    since?: string,
    until?: string
  ): Promise<CompletedTask[]> {
    // Sync API v9の完了済みタスク専用エンドポイントを使用
    const url = new URL(`${this.baseUrl}/completed/get_all`);

    // クエリパラメータを追加
    if (since) url.searchParams.append("since", since);
    if (until) url.searchParams.append("until", until);
    url.searchParams.append("limit", "200"); // 最大200件取得

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`完了済みTodoの取得に失敗しました: ${response.status}`);
    }

    const data = await response.json();

    // completed/get_allエンドポイントからは直接完了済みTodoが返される
    const completedItems = data.items || [];

    // APIレスポンスをバリデーション
    const validatedData = v.parse(CompletedTasksResponseSchema, {
      items: completedItems,
    });

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
   * TaskTodoとマイルストーンTodoを取得
   * @param since 開始日時 (ISO 8601形式)
   * @param until 終了日時 (ISO 8601形式)
   * @returns TaskTodoとマイルストーンTodoの配列
   */
  /**
   * Todoコンテンツから@で始まるラベルを抽出
   * @param content Todoのコンテンツ
   * @returns 抽出されたラベルの配列
   */
  private extractLabelsFromContent(content: string): string[] {
    // 日本語ラベルを含むあらゆる非空白連続文字をラベルとして抽出
    // 例: "@task", "@毎日のタスク"
    const labelRegex = /@([^\s@]+)/gu;
    const labels: string[] = [];
    let match;

    while ((match = labelRegex.exec(content)) !== null) {
      labels.push(match[1]); // @を除いたラベル名を追加
    }

    return labels;
  }

  /**
   * マイルストーンTodoかどうかを判定
   * @param content Todoのコンテンツ
   * @returns マイルストーンTodoの場合true
   */
  private isMilestoneTodo(content: string): boolean {
    return /のマイルストーンを置く$/.test(content);
  }

  public async getCompletedTasksWithTaskLabel(
    since?: string,
    until?: string
  ): Promise<CompletedTask[]> {
    const allCompletedTasks = await this.getCompletedTasks(since, until);

    // ハードコード除外: 「@毎日のタスク」ラベルを持つものは計測対象から除外
    const EXCLUDED_LABEL = "毎日のタスク";

    const filteredTasks = allCompletedTasks.filter((task) => {
      // まず除外対象なら落とす（マイルストーンでも除外）
      if (task.labels.includes(EXCLUDED_LABEL)) return false;
      // 計測対象: @task または マイルストーン
      return task.labels.includes("task") || this.isMilestoneTodo(task.content);
    });

    return filteredTasks;
  }

  /**
   * 当日の作業統計を取得（TaskTodo + マイルストーンTodo）
   * @returns 当日の完了済み・Todo数
   */
  public async getTodayTodoStats(): Promise<TodayTaskStat> {
    const today = new Date();
    const todayKey = format(today, "yyyy-MM-dd");

    // ローカル時間での当日の開始時刻（00:00:00）
    const todayStart = startOfDay(today);

    // ローカル時間での明日の開始時刻（00:00:00）
    const tomorrowStart = startOfDay(addDays(today, 1));

    // 当日の完了済みTodoを取得
    const completedTasks = await this.getCompletedTasksWithTaskLabel(
      todayStart.toISOString(),
      tomorrowStart.toISOString()
    );

    return {
      date: todayKey,
      completedCount: completedTasks.length,
      displayDate: today.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
      }),
    };
  }

  /**
   * 日付別の作業完了統計を取得（TaskTodo + マイルストーンTodo、当日も含む）
   * @param days 過去何日分のデータを取得するか
   * @returns 日付別の完了Todo数
   */
  public async getDailyCompletionStats(
    days: number = 30
  ): Promise<DailyCompletionStat[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const since = startOfDay(startDate).toISOString();
    const until = startOfDay(addDays(endDate, 1)).toISOString();

    const completedTasks = await this.getCompletedTasksWithTaskLabel(
      since,
      until
    );

    const dailyStats = new Map<string, number>();

    completedTasks.forEach((task) => {
      const completedDate = new Date(task.completed_at);
      const dateKey = format(completedDate, "yyyy-MM-dd");

      dailyStats.set(dateKey, (dailyStats.get(dateKey) || 0) + 1);
    });

    const result: DailyCompletionStat[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dateKey = format(date, "yyyy-MM-dd");

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
  items: v.array(
    CompletedTaskSchema,
    "完了済みタスクの配列である必要があります"
  ),
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TodayTaskStatSchema = v.object({
  date: v.pipe(
    v.string("日付は文字列である必要があります"),
    v.isoDate("日付はISO 8601形式である必要があります")
  ),
  completedCount: v.pipe(
    v.number("完了カウントは数値である必要があります"),
    v.minValue(0, "完了カウントは0以上である必要があります")
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

export type CompletedTasksResponse = v.InferOutput<
  typeof CompletedTasksResponseSchema
>;
export type DailyCompletionStat = v.InferOutput<
  typeof DailyCompletionStatSchema
>;
export type TodayTaskStat = v.InferOutput<typeof TodayTaskStatSchema>;
