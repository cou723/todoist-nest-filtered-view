import type { ConfigRepository } from "../../../config/__application/configRepository";
import type { CompletionStatsConfig } from "../../../config/_domain/completionStatsConfig";

interface LoadCompletionStatsConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getCompletionStatsConfig">;
}

export function loadCompletionStatsConfig({
	configRepository,
}: LoadCompletionStatsConfigDeps): CompletionStatsConfig {
	return configRepository.getCompletionStatsConfig();
}
