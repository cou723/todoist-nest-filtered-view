import type { CompletionStatsConfig } from "@/features/config/domain/completionStatsConfig";
import type { TaskPanelConfig } from "@/features/config/domain/taskPanelConfig";

export interface ConfigRepository {
	getTaskPanelConfig(): TaskPanelConfig;
	setTaskPanelConfig(config: TaskPanelConfig): void;
	getCompletionStatsConfig(): CompletionStatsConfig;
	setCompletionStatsConfig(config: CompletionStatsConfig): void;
}
