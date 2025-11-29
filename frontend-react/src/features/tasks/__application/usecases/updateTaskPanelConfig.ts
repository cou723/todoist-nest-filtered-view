import type { ConfigRepository } from "../../../config/__application/configRepository";
import type { TaskPanelConfig } from "../../../config/_domain/taskPanelConfig";

interface UpdateTaskPanelConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "setTaskPanelConfig">;
}

export function updateTaskPanelConfig(
	config: TaskPanelConfig,
	{ configRepository }: UpdateTaskPanelConfigDeps,
): void {
	configRepository.setTaskPanelConfig(config);
}
