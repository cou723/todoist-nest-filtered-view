/**
 * 依存関係ラベルユーティリティのテスト
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { generateDepLabelName } from "./dependency-label-utils.ts";

Deno.test("generateDepLabelName - 基本パターン", () => {
  // 親なしの場合
  assertEquals(
    generateDepLabelName("Buy Card"),
    "dep-Buy_Card"
  );

  // 親ありの場合
  assertEquals(
    generateDepLabelName("Buy Card", "Write Letter"),
    "dep-Write_Letter-Buy_Card"
  );
});

Deno.test("generateDepLabelName - 空白とアンダーバーの処理", () => {
  // 複数の空白
  assertEquals(
    generateDepLabelName("Buy  Birthday   Card"),
    "dep-Buy_Birthday_Card"
  );

  // 既存のハイフンを保持
  assertEquals(
    generateDepLabelName("Buy-Birthday Card"),
    "dep-Buy-Birthday_Card"
  );

  // 親子両方に空白
  assertEquals(
    generateDepLabelName("Buy Card", "Write Thank You Letter"),
    "dep-Write_Thank_You_Letter-Buy_Card"
  );
});

Deno.test("generateDepLabelName - 50文字制限", () => {
  // 50文字ぴったり（親なし）
  const exactlyFiftyChars = "a".repeat(46); // "dep-" + 46文字 = 50文字
  assertEquals(
    generateDepLabelName(exactlyFiftyChars),
    `dep-${exactlyFiftyChars}`
  );

  // 50文字超過（親なし）
  const overFiftyChars = "a".repeat(47); // "dep-" + 47文字 = 51文字
  assertEquals(
    generateDepLabelName(overFiftyChars),
    `dep-${overFiftyChars.substring(0, 46)}` // 46文字で切り詰め
  );

  // 親あり長い名前
  const longParent = "Very Long Parent Task Name";
  const longChild = "Very Long Child Task Name";
  const result = generateDepLabelName(longChild, longParent);
  assertEquals(result.length, 50);
  assertEquals(result.startsWith("dep-Very_Long_Parent_Task_Name-Very_Long"), true);
});

Deno.test("generateDepLabelName - エッジケース", () => {
  // 空文字
  assertEquals(
    generateDepLabelName(""),
    "dep-"
  );

  // 空白のみ
  assertEquals(
    generateDepLabelName("   "),
    "dep-"
  );

  // 特殊文字
  assertEquals(
    generateDepLabelName("Task (with) [brackets] & symbols!"),
    "dep-Task_(with)_[brackets]_&_symbols!"
  );
});

Deno.test("generateDepLabelName - 日本語サポート", () => {
  // 日本語タスク名
  assertEquals(
    generateDepLabelName("カードを買う"),
    "dep-カードを買う"
  );

  // 日本語親子関係
  assertEquals(
    generateDepLabelName("カードを買う", "手紙を書く"),
    "dep-手紙を書く-カードを買う"
  );

  // 日本語での50文字制限
  const longJapanese = "非常に長い日本語のタスク名でテストをしています".repeat(2);
  const result = generateDepLabelName(longJapanese);
  assertEquals(result.length <= 50, true);
  assertEquals(result.startsWith("dep-"), true);
});