import type { ConfigRepository } from "@/features/config/__application/configRepository";
import type { TaskPanelConfig } from "@/features/config/_domain/taskPanelConfig";

interface LoadTaskPanelConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getTaskPanelConfig">;
}

export function loadTaskPanelConfig({
	configRepository,
}: LoadTaskPanelConfigDeps): TaskPanelConfig {
	return configRepository.getTaskPanelConfig();
}
