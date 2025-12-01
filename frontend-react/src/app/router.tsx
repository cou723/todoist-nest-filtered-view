import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGate } from "@/features/auth/ui";

const AppShell = lazy(() =>
	import("@/features/tasks/ui").then((module) => ({
		default: module.AppShell,
	})),
);

const OAuthCallback = lazy(() =>
	import("@/features/auth/ui/OAuthCallback").then((module) => ({
		default: module.OAuthCallback,
	})),
);

export function Router() {
	return (
		<Routes>
			<Route path="/callback" element={<OAuthCallback />} />
			<Route
				path="/*"
				element={
					<AuthGate>
						<AppShell />
					</AuthGate>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
