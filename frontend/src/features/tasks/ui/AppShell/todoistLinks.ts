import type React from "react";

interface TodoistLinks {
	app: string;
	web: string;
}

export const todoistTaskLinks = (taskId: string): TodoistLinks => ({
	app: `todoist://task?id=${taskId}`,
	web: `https://todoist.com/showTask?id=${taskId}`,
});

const isModifiedClick = (event: React.MouseEvent<HTMLAnchorElement>) =>
	event.defaultPrevented ||
	event.button !== 0 ||
	event.metaKey ||
	event.altKey ||
	event.ctrlKey ||
	event.shiftKey;

export const openTodoistPreferApp = (
	event: React.MouseEvent<HTMLAnchorElement>,
	taskId: string,
) => {
	if (isModifiedClick(event)) {
		return;
	}

	event.preventDefault();
	const links = todoistTaskLinks(taskId);
	const openWebFallback = () => {
		window.open(links.web, "_blank", "noreferrer");
	};

	let didBlur = false;
	const handleBlur = () => {
		didBlur = true;
	};
	window.addEventListener("blur", handleBlur);

	const fallbackTimer = window.setTimeout(() => {
		window.removeEventListener("blur", handleBlur);
		if (!didBlur) {
			openWebFallback();
		}
	}, 800);

	const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

	if (isMobile) {
		window.location.href = links.app;
	} else {
		window.open(links.app, "_blank");
	}

	window.setTimeout(() => {
		window.removeEventListener("blur", handleBlur);
		window.clearTimeout(fallbackTimer);
	}, 2000);
};
