import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
	it("renders the application title", () => {
		render(<App />);
		expect(screen.getByText("Todoist Nest Filtered View")).toBeInTheDocument();
	});

	it("renders the phase 1 completion message", () => {
		render(<App />);
		expect(
			screen.getByText("フロントエンド Phase 1 - プロジェクトセットアップ完了"),
		).toBeInTheDocument();
	});
});
