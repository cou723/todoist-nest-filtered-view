import { Navigate, Route, Routes } from "react-router-dom";
import { OAuthCallback } from "../features/auth/___ui/OAuthCallback";
import { AuthGate } from "../features/auth/___ui/AuthGate";
import { AppShell } from "../features/taskTree/___ui/AppShell";

export function Router() {
	return (
		<Routes>
		<Route path="/callback" element={<OAuthCallback />} />
		<Route
			path="/*"
			element={(
				<AuthGate>
					<AppShell />
				</AuthGate>
			)}
		/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
