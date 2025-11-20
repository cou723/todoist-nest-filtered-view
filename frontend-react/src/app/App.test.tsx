import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
	it("renders the application title", () => {
		render(<App />);
		expect(screen.getByText("Todoist Nest Filtered View")).toBeInTheDocument();
	});

	it("renders all four panels with correct data-testid attributes", () => {
		render(<App />);

		// Check for all four panels
		expect(screen.getByTestId("goal-rate-panel")).toBeInTheDocument();
		expect(screen.getByTestId("dated-goals-panel")).toBeInTheDocument();
		expect(screen.getByTestId("completion-stats-panel")).toBeInTheDocument();
		expect(screen.getByTestId("task-list-panel")).toBeInTheDocument();
	});

	it("renders panel titles", () => {
		render(<App />);

		expect(screen.getByText("ゴール率")).toBeInTheDocument();
		expect(screen.getByText("日付付きゴール")).toBeInTheDocument();
		expect(screen.getByText("完了統計")).toBeInTheDocument();
		expect(screen.getByText("タスク一覧")).toBeInTheDocument();
	});

	it("renders theme toggle button", () => {
		render(<App />);
		expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
	});
});
