import type { ConfigRepository } from "../__application/configRepository";
import type { TaskPanelConfig } from "../_domain/taskPanelConfig";

const TASK_PANEL_CONFIG_KEY = "task_panel_config";
const LEGACY_FILTER_KEY = "todoist_filter_query";

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
}
