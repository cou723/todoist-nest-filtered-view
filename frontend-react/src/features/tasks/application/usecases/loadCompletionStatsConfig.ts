import type { ConfigRepository } from "@/features/config/application";
import type { CompletionStatsConfig } from "@/features/config/domain";

interface LoadCompletionStatsConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getCompletionStatsConfig">;
}

export function loadCompletionStatsConfig({
	configRepository,
}: LoadCompletionStatsConfigDeps): CompletionStatsConfig {
	return configRepository.getCompletionStatsConfig();
}
