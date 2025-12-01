/**
 * Unstable APIを使わず、デプロイ時の挙動確認だけを行うモック版。
 * 本処理は実行せずログのみを出力する。
 */

const main = async (): Promise<void> => {
  console.log("[mock] cron disabled; no unstable APIs");
};

await main();
