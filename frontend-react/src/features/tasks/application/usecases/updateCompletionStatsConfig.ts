import type { ConfigRepository } from "@/features/config/application/configRepository";
import type { CompletionStatsConfig } from "@/features/config/domain/completionStatsConfig";

interface UpdateCompletionStatsConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "setCompletionStatsConfig">;
}

export function updateCompletionStatsConfig(
	config: CompletionStatsConfig,
	{ configRepository }: UpdateCompletionStatsConfigDeps,
): void {
	configRepository.setCompletionStatsConfig(config);
}
