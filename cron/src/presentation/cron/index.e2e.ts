import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Effect } from "effect";

import { ManageMilestonesUseCase } from "../../application/usecase/manage-milestones.usecase.ts";
import { ManageDependencyLabelsUseCase } from "../../application/usecase/manage-dependency-labels.usecase.ts";
import {
  createTestTodo,
  MockTodoRepository,
} from "../cli/test-utils.ts";

/**
 * E2Eテスト: presentation/cron/main.tsの統合テスト
 * 実際のAPIの代わりにMockTodoRepositoryを使用して、全体のフローをテストします
 */
async function runCronJobE2E(mockRepo: MockTodoRepository) {
  try {
    console.log(`[${new Date().toISOString()}] E2E cronジョブを開始...`);

    const manageMilestonesUseCase = new ManageMilestonesUseCase(mockRepo);
    const manageDependencyLabelsUseCase = new ManageDependencyLabelsUseCase(
      mockRepo,
    );

    // 本番コードと同じ構造でUseCaseを実行
    const program = Effect.all([
      manageMilestonesUseCase.execute(),
      manageDependencyLabelsUseCase.execute(),
    ], { concurrency: 2 });

    await Effect.runPromise(program);

    console.log(
      `[${new Date().toISOString()}] E2E cronジョブが正常に完了しました`,
    );
  } catch (error) {
    console.error("E2E cronジョブでエラーが発生:", error);
    throw error; // テストではエラーを失敗として扱う
  }
}

Deno.test("E2E: @non-milestoneラベルが正しく付与され、他のTodoに影響がないこと", async () => {
  const mockRepo = new MockTodoRepository();

  // テストデータの準備: 様々な状態のゴールTodoを設定
  const testTodos = [
    // リーフゴール（@non-milestoneラベルが付与されるべき）
    createTestTodo("1", "リーフゴール", ["goal"]),

    // タスクの子を持つゴール（@non-milestoneラベルが付与されないべき）
    createTestTodo("2", "タスク付きゴール", ["goal"]),
    createTestTodo("3", "子タスク1", ["task"], "2"),
    createTestTodo("4", "子タスク2", ["task"], "2"),

    // ゴールの子を持つゴール（@non-milestoneラベルが付与されないべき）
    createTestTodo("5", "ゴール付きゴール", ["goal"]),
    createTestTodo("6", "子ゴール", ["goal"], "5"),

    // 既に@non-milestoneを持つゴール（マイルストーンTodoが作成されるべき）
    createTestTodo("7", "既にnon-milestone付きゴール", [
      "goal",
      "non-milestone",
    ]),

    // 通常のタスク
    createTestTodo("8", "通常タスク1", ["task"]),
    createTestTodo("9", "通常タスク2", ["task"]),

    // 何かしらの原因によりマイルストーンTodoが既に存在するゴール(@non-milestoneラベルが付与されるべき)
    createTestTodo("10", "ゴール付きゴール", ["goal"]),
    createTestTodo("11", "ゴール付きゴールのマイルストーンを置く", [], "10"),
  ];

  mockRepo.setTodos(testTodos);

  // 完全なcronジョブを実行
  await runCronJobE2E(mockRepo);

  // 期待値の検証
  const todos = mockRepo.getTodos_mock();

  // リーフゴールが@non-milestoneラベルを取得したか確認
  const leafGoal = todos.find((t) => t.id.value === "1");
  assertEquals(
    leafGoal?.hasLabel("non-milestone"),
    true,
    "リーフゴールは@non-milestoneラベルを持つべきです",
  );

  // タスクの子を持つゴールが@non-milestoneラベルを取得しなかったか確認
  const goalWithTasks = todos.find((t) => t.id.value === "2");
  assertEquals(
    goalWithTasks?.hasLabel("non-milestone"),
    false,
    "タスクの子を持つゴールは@non-milestoneラベルを持たないべきです",
  );

  // ゴールの子を持つゴールが@non-milestoneラベルを取得しなかったか確認
  const goalWithGoals = todos.find((t) => t.id.value === "5");
  assertEquals(
    goalWithGoals?.hasLabel("non-milestone"),
    false,
    "ゴールの子を持つゴールは@non-milestoneラベルを持たないべきです",
  );

  // 通常のタスクが変更されていないか確認
  const regularTask = todos.find((t) => t.id.value === "9");
  assertEquals(
    regularTask?.hasLabel("task"),
    true,
    "通常のタスクは引き続き@taskラベルを持つべきです",
  );
  assertEquals(
    regularTask?.content,
    "通常タスク2",
    "通常のタスクのcontentは変更されないべきです",
  );

  const nonMilestoneGoalWithMilestoneTask = todos.find((t) => t.id.value === "10");
  assertEquals(
    nonMilestoneGoalWithMilestoneTask?.hasLabel("non-milestone"),
    true,
    "マイルストーンTodoを持つゴールには@non-milestoneラベルがついているべきです",
  );

  console.log("✓ E2Eテスト成功: @non-milestoneラベルが正しく付与され、他のTodoに影響がありません");
});

Deno.test("E2E: マイルストーンTodoを正しく作成", async () => {
  const mockRepo = new MockTodoRepository();

  // テストデータの準備: マイルストーンTodoが作成されるべき@non-milestoneゴール
  const testTodos = [
    createTestTodo("1", "目標A", ["goal", "non-milestone"]),
    createTestTodo("2", "目標B", ["goal", "non-milestone"]),
    // タスクの子を持つゴール - マイルストーンTodoは作成されないべき
    createTestTodo("3", "タスク付き目標", ["goal", "non-milestone"]),
    createTestTodo("4", "子タスク", ["task"], "3"),
  ];

  mockRepo.setTodos(testTodos);

  // 完全なcronジョブを実行
  await runCronJobE2E(mockRepo);

  const todos = mockRepo.getTodos_mock();

  // タスク/ゴールの子を持たないゴールにマイルストーンTodoが作成されたか確認
  const milestoneTodos = todos.filter((t) =>
    t.content.includes("のマイルストーンを置く")
  );

  assertEquals(
    milestoneTodos.length >= 2,
    true,
    "少なくとも2つのマイルストーンTodoが作成されるべきです",
  );

  // マイルストーンTodoが正しい親IDを持つか確認
  const milestone1 = milestoneTodos.find((t) => t.parentId?.value === "1");
  const milestone2 = milestoneTodos.find((t) => t.parentId?.value === "2");

  assertEquals(
    milestone1 !== undefined,
    true,
    "ゴール1のマイルストーンTodoが存在するべきです",
  );
  assertEquals(
    milestone2 !== undefined,
    true,
    "ゴール2のマイルストーンTodoが存在するべきです",
  );

  // マイルストーンTodoのcontentが正しいか確認
  assertEquals(
    milestone1?.content,
    "目標Aのマイルストーンを置く",
    "マイルストーンTodoのcontentが正しいべきです",
  );
  assertEquals(
    milestone2?.content,
    "目標Bのマイルストーンを置く",
    "マイルストーンTodoのcontentが正しいべきです",
  );

  console.log("✓ E2Eテスト成功: マイルストーンTodoが正しく作成されました");
});

Deno.test("E2E: 空のTodoリストを処理", async () => {
  const mockRepo = new MockTodoRepository();
  mockRepo.setTodos([]);

  // 空のTodoリストでもエラーをスローしないべき
  await runCronJobE2E(mockRepo);

  const todos = mockRepo.getTodos_mock();
  assertEquals(todos.length, 0, "Todoが作成されないべきです");

  console.log("✓ E2Eテスト成功: 空のTodoリストが正しく処理されました");
});

Deno.test("E2E: ゴールの依存関係ラベルを管理", async () => {
  const mockRepo = new MockTodoRepository();

  // テストデータの準備: ゴールTodoの設定（依存関係ラベルはゴールに対して作成される）
  const testTodos = [
    // 子ゴールを持つ親ゴール
    createTestTodo("1", "親ゴール", ["goal"]),
    createTestTodo("2", "子ゴール1", ["goal"], "1"),
    createTestTodo("3", "子ゴール2", ["goal"], "1"),

    // 独立ゴール
    createTestTodo("4", "独立ゴール", ["goal"]),

    // 通常のタスク（依存関係ラベルUseCaseの影響を受けない）
    createTestTodo("5", "タスク1", ["task"]),
    createTestTodo("6", "タスク2", ["task"]),
  ];

  mockRepo.setTodos(testTodos);

  // 完全なcronジョブを実行
  await runCronJobE2E(mockRepo);

  const labels = mockRepo.getLabels_mock();

  // ゴールに対して依存関係ラベルが作成されたか確認
  const depLabels = labels.filter((l) => l.isDependencyLabel());

  assertEquals(
    depLabels.length >= 3,
    true,
    "ゴールに対して少なくとも3つの依存関係ラベルが作成されるべきです",
  );

  // すべてのゴールTodoがまだ存在するか確認
  const todos = mockRepo.getTodos_mock();
  assertEquals(
    todos.filter((t) => t.hasLabel("goal")).length,
    4,
    "4つすべてのゴールTodoが存在するべきです",
  );

  // Todoのcontentが変更されていないか確認
  const parentGoal = todos.find((t) => t.id.value === "1");
  const childGoal1 = todos.find((t) => t.id.value === "2");
  const childGoal2 = todos.find((t) => t.id.value === "3");
  const independentGoal = todos.find((t) => t.id.value === "4");

  assertEquals(
    parentGoal?.content,
    "親ゴール",
    "親ゴールのcontentは変更されないべきです",
  );
  assertEquals(
    childGoal1?.content,
    "子ゴール1",
    "子ゴール1のcontentは変更されないべきです",
  );
  assertEquals(
    childGoal2?.content,
    "子ゴール2",
    "子ゴール2のcontentは変更されないべきです",
  );
  assertEquals(
    independentGoal?.content,
    "独立ゴール",
    "独立ゴールのcontentは変更されないべきです",
  );

  console.log("✓ E2Eテスト成功: ゴールの依存関係ラベルが正しく管理されました");
});
