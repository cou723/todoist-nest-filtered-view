import type { ConfigRepository } from "@/features/config/application";
import type { TaskPanelConfig } from "@/features/config/domain";

interface UpdateTaskPanelConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "setTaskPanelConfig">;
}

export function updateTaskPanelConfig(
	config: TaskPanelConfig,
	{ configRepository }: UpdateTaskPanelConfigDeps,
): void {
	configRepository.setTaskPanelConfig(config);
}
