import type { CompletionStatsConfig } from "@/features/config/_domain/completionStatsConfig";
import type { TaskPanelConfig } from "@/features/config/_domain/taskPanelConfig";

export interface ConfigRepository {
	getTaskPanelConfig(): TaskPanelConfig;
	setTaskPanelConfig(config: TaskPanelConfig): void;
	getCompletionStatsConfig(): CompletionStatsConfig;
	setCompletionStatsConfig(config: CompletionStatsConfig): void;
}
