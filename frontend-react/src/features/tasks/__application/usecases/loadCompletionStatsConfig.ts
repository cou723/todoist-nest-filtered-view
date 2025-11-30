import type { ConfigRepository } from "@/features/config/__application/configRepository";
import type { CompletionStatsConfig } from "@/features/config/_domain/completionStatsConfig";

interface LoadCompletionStatsConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getCompletionStatsConfig">;
}

export function loadCompletionStatsConfig({
	configRepository,
}: LoadCompletionStatsConfigDeps): CompletionStatsConfig {
	return configRepository.getCompletionStatsConfig();
}
