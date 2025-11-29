import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGate } from "../features/auth/___ui/AuthGate";
import { OAuthCallback } from "../features/auth/___ui/OAuthCallback";
import { AppShell } from "../features/tasks/___ui/AppShell";

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
