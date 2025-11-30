import type { ConfigRepository } from "@/features/config/application";
import type { TaskPanelConfig } from "@/features/config/domain";

interface LoadTaskPanelConfigDeps {
	readonly configRepository: Pick<ConfigRepository, "getTaskPanelConfig">;
}

export function loadTaskPanelConfig({
	configRepository,
}: LoadTaskPanelConfigDeps): TaskPanelConfig {
	return configRepository.getTaskPanelConfig();
}
