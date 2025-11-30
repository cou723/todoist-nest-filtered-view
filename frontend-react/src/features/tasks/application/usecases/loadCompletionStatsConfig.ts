import type { ConfigRepository } from "@/features/config/application/configRepository";
import type { CompletionStatsConfig } from "@/features/config/domain/completionStatsConfig";

interface LoadCompletionStatsConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getCompletionStatsConfig">;
}

export function loadCompletionStatsConfig({
	configRepository,
}: LoadCompletionStatsConfigDeps): CompletionStatsConfig {
	return configRepository.getCompletionStatsConfig();
}
