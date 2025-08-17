/**
 * デバッグ用実行ファイル
 * runAutomationを手動で実行するためのスクリプト
 */

import { runAutomation } from "./main.ts";

// .envファイルを手動で読み込み
try {
  const envFile = await Deno.readTextFile(".env");
  const lines = envFile.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        Deno.env.set(key, valueParts.join("="));
      }
    }
  }
  console.log("✅ .env file loaded");
} catch (error) {
  console.log("❌ Could not load .env file:", error.message);
}

console.log("=== Debug Mode: Running Automation ===");
await runAutomation();
console.log("=== Debug Mode: Completed ===");