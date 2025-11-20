import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		sessionStorage.clear();
	});

	it("renders login form when not authenticated", () => {
		render(<App />);
		expect(screen.getByText("Todoist Nest Filtered View")).toBeInTheDocument();
		expect(
			screen.getByText("Todoistのアクセストークンを入力してください"),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Todoist Access Token *")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "ログイン" }),
		).toBeInTheDocument();
	});

	it("renders authenticated app when token exists in localStorage", () => {
		// Set a token in localStorage to simulate authenticated state
		localStorage.setItem("todoist_token", "test_token_123");

		render(<App />);

		// Should show the main title
		expect(screen.getByText("Todoist Nest Filtered View")).toBeInTheDocument();

		// Should show panels when authenticated
		expect(screen.getByText("ゴール率")).toBeInTheDocument();
		expect(screen.getByText("日付付きゴール")).toBeInTheDocument();
		expect(screen.getByText("完了統計")).toBeInTheDocument();
		expect(screen.getByText("タスク一覧")).toBeInTheDocument();

		// Should show logout button
		expect(
			screen.getByRole("button", { name: "ログアウト" }),
		).toBeInTheDocument();
	});

	it("renders all four panels with correct data-testid attributes when authenticated", () => {
		localStorage.setItem("todoist_token", "test_token_123");
		render(<App />);

		// Check for all four panels
		expect(screen.getByTestId("goal-rate-panel")).toBeInTheDocument();
		expect(screen.getByTestId("dated-goals-panel")).toBeInTheDocument();
		expect(screen.getByTestId("completion-stats-panel")).toBeInTheDocument();
		expect(screen.getByTestId("task-list-panel")).toBeInTheDocument();
	});
});
