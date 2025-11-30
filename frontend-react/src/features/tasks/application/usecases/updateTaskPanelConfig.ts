import type { ConfigRepository } from "@/features/config/application/configRepository";
import type { TaskPanelConfig } from "@/features/config/domain/taskPanelConfig";

interface UpdateTaskPanelConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "setTaskPanelConfig">;
}

export function updateTaskPanelConfig(
	config: TaskPanelConfig,
	{ configRepository }: UpdateTaskPanelConfigDeps,
): void {
	configRepository.setTaskPanelConfig(config);
}
