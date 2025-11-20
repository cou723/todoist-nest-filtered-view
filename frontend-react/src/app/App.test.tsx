import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
	it("renders the application title", () => {
		render(<App />);
		// Title appears in both header and login panel
		const titles = screen.getAllByText("Todoist Nest Filtered View");
		expect(titles.length).toBeGreaterThan(0);
	});

	it("renders login panel when unauthenticated", () => {
		render(<App />);

		// Check for login panel
		expect(screen.getByTestId("login-panel")).toBeInTheDocument();
		expect(screen.getByTestId("login-button")).toBeInTheDocument();
		expect(screen.getByText("Todoistでログイン")).toBeInTheDocument();
	});

	it("renders login panel description", () => {
		render(<App />);

		// Check for specific text in login panel (using test ID to ensure we're looking at the right element)
		const loginPanel = screen.getByTestId("login-panel");
		expect(loginPanel.textContent).toContain("Todoistアカウントでログインして");
	});

	it("renders theme toggle button", () => {
		render(<App />);
		expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
	});
});
