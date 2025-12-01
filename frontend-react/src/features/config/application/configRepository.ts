import type {
	CompletionStatsConfig,
	TaskPanelConfig,
} from "@/features/config/domain";

export interface ConfigRepository {
	getTaskPanelConfig(): TaskPanelConfig;
	setTaskPanelConfig(config: TaskPanelConfig): void;
	getCompletionStatsConfig(): CompletionStatsConfig;
	setCompletionStatsConfig(config: CompletionStatsConfig): void;
}
