export type Task = {
	id: string;
	summary: string;
	labels: string[];
	deadline: Date | null;
	priority: number;
	parentId: string | null;
};
