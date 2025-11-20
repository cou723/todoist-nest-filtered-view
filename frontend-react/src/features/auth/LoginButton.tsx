/**
 * LoginButton - Todoistログインボタンコンポーネント
 */

import { Button } from "@mantine/core";
import { IconLogin } from "@tabler/icons-react";
import { useAuth } from "../../shared/auth";

export function LoginButton() {
	const { login, isProcessingAuth } = useAuth();

	return (
		<Button
			size="lg"
			leftSection={<IconLogin size={24} />}
			onClick={login}
			loading={isProcessingAuth}
			data-testid="login-button"
		>
			Todoistでログイン
		</Button>
	);
}
