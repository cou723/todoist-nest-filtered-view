import type { ConfigRepository } from "@/features/config/application";
import type { CompletionStatsConfig } from "@/features/config/domain";

interface UpdateCompletionStatsConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "setCompletionStatsConfig">;
}

export function updateCompletionStatsConfig(
	config: CompletionStatsConfig,
	{ configRepository }: UpdateCompletionStatsConfigDeps,
): void {
	configRepository.setCompletionStatsConfig(config);
}
