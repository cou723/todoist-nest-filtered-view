import type { Effect } from "effect";
import type { CompletedTask } from "../_domain/completionStats";

export class CompletionStatsRepositoryError extends Error {
	status?: number;

	constructor(message: string, status?: number) {
		super(message);
		this.status = status;
	}
}

export interface CompletionStatsRepository {
	fetchCompletedTasks(params: {
		since: Date;
		until: Date;
	}): Effect.Effect<CompletedTask[], CompletionStatsRepositoryError>;
}
