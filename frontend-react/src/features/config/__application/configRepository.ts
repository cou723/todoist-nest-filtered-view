import type { CompletionStatsConfig } from "../_domain/completionStatsConfig";
import type { TaskPanelConfig } from "../_domain/taskPanelConfig";

export interface ConfigRepository {
	getTaskPanelConfig(): TaskPanelConfig;
	setTaskPanelConfig(config: TaskPanelConfig): void;
	getCompletionStatsConfig(): CompletionStatsConfig;
	setCompletionStatsConfig(config: CompletionStatsConfig): void;
}
