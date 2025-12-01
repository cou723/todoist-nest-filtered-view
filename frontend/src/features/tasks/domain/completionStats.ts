export type CompletedTask = {
	id: string;
	content: string;
	completedAt: Date;
	labels: string[];
};

export type DailyCompletionCount = {
	date: Date;
	count: number;
	movingAverage: number;
};

export type CompletionSummary = {
	last90DaysTotal: number;
	last7DaysTotal: number;
	last7DaysAverage: number;
	todayCount: number;
};

export type CompletionStats = {
	daily: DailyCompletionCount[];
	summary: CompletionSummary;
};
