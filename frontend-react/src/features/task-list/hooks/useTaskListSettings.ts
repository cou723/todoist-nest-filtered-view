/**
 * Hook for managing task list settings with localStorage persistence
 */

import { useEffect, useState } from "react";

const FILTER_QUERY_KEY = "todoist_filter_query";
const HIDE_DEP_TASKS_KEY = "todoist_hide_dep_todos";

export interface TaskListSettings {
	filterQuery: string;
	hideDepTasks: boolean;
}

export function useTaskListSettings() {
	const [filterQuery, setFilterQuery] = useState<string>(() => {
		return localStorage.getItem(FILTER_QUERY_KEY) || "";
	});

	const [hideDepTasks, setHideDepTasks] = useState<boolean>(() => {
		return localStorage.getItem(HIDE_DEP_TASKS_KEY) === "true";
	});

	// Persist filterQuery to localStorage
	useEffect(() => {
		localStorage.setItem(FILTER_QUERY_KEY, filterQuery);
	}, [filterQuery]);

	// Persist hideDepTasks to localStorage
	useEffect(() => {
		localStorage.setItem(HIDE_DEP_TASKS_KEY, String(hideDepTasks));
	}, [hideDepTasks]);

	return {
		filterQuery,
		setFilterQuery,
		hideDepTasks,
		setHideDepTasks,
	};
}
