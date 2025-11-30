import type { ConfigRepository } from "@/features/config/application/configRepository";
import type { CompletionStatsConfig } from "@/features/config/domain/completionStatsConfig";
import type { TaskPanelConfig } from "@/features/config/domain/taskPanelConfig";

const TASK_PANEL_CONFIG_KEY = "task_panel_config";
const LEGACY_FILTER_KEY = "todoist_filter_query";
const COMPLETION_STATS_CONFIG_KEY = "completion_stats_config";

const normalizeLabels = (labels: unknown): string[] => {
	if (!Array.isArray(labels)) {
		return [];
	}

	const normalized = labels
		.map((label) => (typeof label === "string" ? label.trim() : ""))
		.filter((label): label is string => label.length > 0)
		.map((label) => label.replace(/^@+/, ""));

	return Array.from(new Set(normalized));
};

export class LocalStorageConfigRepository implements ConfigRepository {
	private readonly storage: Storage;

	constructor(storage: Storage) {
		this.storage = storage;
	}

	getTaskPanelConfig(): TaskPanelConfig {
		const raw = this.storage.getItem(TASK_PANEL_CONFIG_KEY);
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed.filter === "string") {
					return { filter: parsed.filter };
				}
			} catch {
				// フォーマットエラーは無視し、デフォルトにフォールバック
			}
		}

		const legacyFilter = this.storage.getItem(LEGACY_FILTER_KEY);
		if (typeof legacyFilter === "string") {
			return { filter: legacyFilter };
		}

		return { filter: "" };
	}

	setTaskPanelConfig(config: TaskPanelConfig): void {
		this.storage.setItem(
			TASK_PANEL_CONFIG_KEY,
			JSON.stringify({ filter: config.filter }),
		);
	}

	getCompletionStatsConfig(): CompletionStatsConfig {
		const raw = this.storage.getItem(COMPLETION_STATS_CONFIG_KEY);
		if (!raw) {
			return { excludedLabels: [] };
		}

		try {
			const parsed = JSON.parse(raw);
			const labels = normalizeLabels(parsed?.excludedLabels);
			return { excludedLabels: labels };
		} catch {
			return { excludedLabels: [] };
		}
	}

	setCompletionStatsConfig(config: CompletionStatsConfig): void {
		const normalized = normalizeLabels(config.excludedLabels);
		this.storage.setItem(
			COMPLETION_STATS_CONFIG_KEY,
			JSON.stringify({ excludedLabels: normalized }),
		);
	}
}
