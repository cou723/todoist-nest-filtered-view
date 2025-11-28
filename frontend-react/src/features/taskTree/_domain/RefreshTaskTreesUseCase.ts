type ParentTask = {
	id: string;
	summary: string;
	parent: ParentTask | null;
};
export type RefreshTaskTreesUseCase = (filter: string) => {
	summary: string;
	labe: string[];
	deadline: Date;
	priority: number;
	parent: ParentTask | null;
}[];
