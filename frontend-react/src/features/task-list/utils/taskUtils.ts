/**
 * Task utility functions for sorting and filtering
 * Adapted from frontend-lit-legacy implementation
 */

import type { TaskNode } from "../../../shared/todoist/schema";

/**
 * Build ancestor chain from root to current task
 */
function buildAncestorChain(task: TaskNode): TaskNode[] {
	const chain: TaskNode[] = [];
	let current = task.parent;

	while (current) {
		chain.unshift(current); // Add at the beginning (oldest ancestor first)
		current = current.parent;
	}

	// Add self
	chain.push(task);

	return chain;
}

/**
 * Compare tasks hierarchically
 * Compare parent ordering at each level, then compare self ordering
 */
function compareTasksHierarchically(a: TaskNode, b: TaskNode): number {
	// Build ancestor chains for both tasks
	const ancestorsA = buildAncestorChain(a);
	const ancestorsB = buildAncestorChain(b);

	// Compare up to common hierarchy level
	const minLength = Math.min(ancestorsA.length, ancestorsB.length);

	for (let i = 0; i < minLength; i++) {
		const ancestorA = ancestorsA[i];
		const ancestorB = ancestorsB[i];

		// If same ancestor, continue to next level
		if (ancestorA.id === ancestorB.id) {
			continue;
		}

		// If different ancestors, compare their ordering
		return ancestorA.order - ancestorB.order;
	}

	// If all ancestors are the same, shallower hierarchy comes first
	if (ancestorsA.length !== ancestorsB.length) {
		return ancestorsA.length - ancestorsB.length;
	}

	// Same hierarchy level, compare self ordering
	return a.order - b.order;
}

/**
 * Sort tasks by priority (hierarchical sort)
 * If same priority, sort by hierarchy ordering
 */
export function sortTasksByPriority(tasks: TaskNode[]): TaskNode[] {
	return [...tasks].sort((a, b) => {
		// If priority is different, sort by priority
		if (a.priority !== b.priority) {
			return b.priority - a.priority;
		}
		// If same priority, sort hierarchically
		return compareTasksHierarchically(a, b);
	});
}

/**
 * Get ancestor chain for display
 */
export function getAncestorChain(task: TaskNode): TaskNode[] {
	const chain: TaskNode[] = [];
	let current = task.parent;

	while (current) {
		chain.unshift(current); // Add at the beginning (oldest ancestor first)
		current = current.parent;
	}

	return chain;
}

/**
 * Get priority text in Japanese
 */
export function getPriorityText(priority: number): string {
	switch (priority) {
		case 4:
			return "緊急/重要";
		case 3:
			return "不急/重要";
		case 2:
			return "緊急/些末";
		default:
			return "不急/些末";
	}
}
