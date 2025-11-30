import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGate, OAuthCallback } from "@/features/auth/ui";
import { AppShell } from "@/features/tasks/ui";

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
