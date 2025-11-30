import { Container, Loader } from "@mantine/core";
import type { ReactNode } from "react";
import { LoginForm, useAuth } from "@/features/auth/ui";

interface AuthGateProps {
	children: ReactNode;
}

/**
 * 認証状態に応じてUIを切り替える境界
 * - ローディングやログインフォームを集約しAppShellをシンプル化
 */
export function AuthGate({ children }: AuthGateProps) {
	const { isAuthenticated, isLoading, authError, startOAuth } = useAuth();

	if (isLoading) {
		return (
			<Container
				size="xl"
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
				}}
			>
				<Loader size="lg" />
			</Container>
		);
	}

	if (!isAuthenticated) {
		return (
			<LoginForm onOAuth={startOAuth} isLoading={isLoading} error={authError} />
		);
	}

	return <>{children}</>;
}
