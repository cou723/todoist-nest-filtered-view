import type { ConfigRepository } from "../../../config/__application/configRepository";
import type { CompletionStatsConfig } from "../../../config/_domain/completionStatsConfig";

interface UpdateCompletionStatsConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "setCompletionStatsConfig">;
}

export function updateCompletionStatsConfig(
	config: CompletionStatsConfig,
	{ configRepository }: UpdateCompletionStatsConfigDeps,
): void {
	configRepository.setCompletionStatsConfig(config);
}
