/**
 * Todoist依存を完全に外した最小Cron実装。
 * 1時間おきに空のジョブを登録し、動作確認のみを行う。
 */

const tick = () => {
  console.log("[mock] cron tick without todoist dependency");
};

Deno.cron("todoist-automation", "0 * * * *", tick);

console.log("Scheduled mock cron without todoist or npm dependencies");
