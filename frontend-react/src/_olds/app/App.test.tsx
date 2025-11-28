import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../app/App";

describe("App", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		sessionStorage.clear();
		window.history.pushState({}, "", "/");

		(import.meta.env as Record<string, string>).VITE_TODOIST_CLIENT_ID =
			"test-client";
		(import.meta.env as Record<string, string>).VITE_PROXY_URL =
			"http://localhost:8000";
		(import.meta.env as Record<string, string>).VITE_TODOIST_REDIRECT_URI =
			"http://localhost:5173/callback";
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders OAuth login when not authenticated", () => {
		render(<App />);
		expect(screen.getByText("Todoist Nest Filtered View")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Todoistでログイン" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("デバッグ用のアクセストークン手動入力"),
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

	it("handles OAuth callback and stores token", async () => {
		// state を保存
		localStorage.setItem("oauth_state", "state-123");
		window.history.pushState({}, "", "/callback?code=abc&state=state-123");

		const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						access_token: "proxy_token_456",
						token_type: "Bearer",
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				),
			),
		);

		render(<App />);

		await waitFor(
			() =>
				expect(localStorage.getItem("todoist_token")).toBe("proxy_token_456"),
			{ timeout: 2000 },
		);

		await waitFor(() => expect(window.location.pathname).toBe("/"), {
			timeout: 2000,
		});

		const logoutButton = await screen.findByRole("button", {
			name: "ログアウト",
			timeout: 2000,
		});
		expect(logoutButton).toBeInTheDocument();

		expect(fetchSpy).toHaveBeenCalledWith(
			"http://localhost:8000/oauth/token",
			expect.any(Object),
		);
	});
});
