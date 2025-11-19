import { MantineProvider } from "@mantine/core";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "./useTheme";

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
};

// Wrapper component that provides MantineProvider
function wrapper({ children }: { children: ReactNode }) {
	return <MantineProvider>{children}</MantineProvider>;
}

describe("useTheme", () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		// Clear document.documentElement.dataset.theme
		delete document.documentElement.dataset.theme;
		// Clear mantine color scheme attribute
		document.documentElement.removeAttribute("data-mantine-color-scheme");
	});

	it("should initialize with light theme when no preference is set", () => {
		mockMatchMedia(false);

		const { result } = renderHook(() => useTheme(), { wrapper });

		expect(result.current.theme).toBe("light");
		expect(document.documentElement.dataset.theme).toBe("light");
	});

	it("should sync data-theme attribute with color scheme", () => {
		mockMatchMedia(false);

		const { result } = renderHook(() => useTheme(), { wrapper });

		// Verify that data-theme attribute is synced with Mantine's color scheme
		expect(result.current.theme).toBe(document.documentElement.dataset.theme);
	});

	it("should initialize with stored theme from localStorage", () => {
		mockMatchMedia(true); // system prefers dark
		localStorage.setItem("mantine-color-scheme-value", "light"); // but user chose light

		const { result } = renderHook(() => useTheme(), { wrapper });

		expect(result.current.theme).toBe("light");
		expect(document.documentElement.dataset.theme).toBe("light");
	});

	it("should toggle theme from light to dark", () => {
		mockMatchMedia(false);

		const { result } = renderHook(() => useTheme(), { wrapper });

		expect(result.current.theme).toBe("light");

		act(() => {
			result.current.toggleTheme();
		});

		expect(result.current.theme).toBe("dark");
		expect(document.documentElement.dataset.theme).toBe("dark");
	});

	it("should toggle theme from dark to light", () => {
		mockMatchMedia(false);
		localStorage.setItem("mantine-color-scheme-value", "dark");

		const { result } = renderHook(() => useTheme(), { wrapper });

		expect(result.current.theme).toBe("dark");

		act(() => {
			result.current.toggleTheme();
		});

		expect(result.current.theme).toBe("light");
		expect(document.documentElement.dataset.theme).toBe("light");
	});

	it("should set theme directly", () => {
		mockMatchMedia(false);

		const { result } = renderHook(() => useTheme(), { wrapper });

		act(() => {
			result.current.setTheme("dark");
		});

		expect(result.current.theme).toBe("dark");
		expect(document.documentElement.dataset.theme).toBe("dark");
	});
});
