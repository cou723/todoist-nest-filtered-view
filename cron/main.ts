import { runCronJob } from "./src/presentation/cron/index.ts";

Deno.cron("sample cron", "*/5 * * * *", async () => {
  console.log("=== Running scheduled automation ===");
  await runCronJob();
  console.log("=== Scheduled automation completed ===");
});
