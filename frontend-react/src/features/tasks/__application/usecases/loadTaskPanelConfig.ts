import type { ConfigRepository } from "../../../config/__application/configRepository";
import type { TaskPanelConfig } from "../../../config/_domain/taskPanelConfig";

interface LoadTaskPanelConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getTaskPanelConfig">;
}

export function loadTaskPanelConfig({
	configRepository,
}: LoadTaskPanelConfigDeps): TaskPanelConfig {
	return configRepository.getTaskPanelConfig();
}
