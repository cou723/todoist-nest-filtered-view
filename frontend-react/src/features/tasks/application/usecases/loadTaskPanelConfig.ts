import type { ConfigRepository } from "@/features/config/application/configRepository";
import type { TaskPanelConfig } from "@/features/config/domain/taskPanelConfig";

interface LoadTaskPanelConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getTaskPanelConfig">;
}

export function loadTaskPanelConfig({
	configRepository,
}: LoadTaskPanelConfigDeps): TaskPanelConfig {
	return configRepository.getTaskPanelConfig();
}
