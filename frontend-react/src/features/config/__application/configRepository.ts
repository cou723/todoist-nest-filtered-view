import type { TaskPanelConfig } from "../_domain/taskPanelConfig";

export interface ConfigRepository {
	getTaskPanelConfig(): TaskPanelConfig;
	setTaskPanelConfig(config: TaskPanelConfig): void;
}
