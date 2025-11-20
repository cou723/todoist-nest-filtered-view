/**
 * LoginPanel - 未認証時のログインパネル
 */

import { Alert, Center, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useAuth } from "../../shared/auth";
import { PanelWrapper } from "../../shared/components/PanelWrapper";
import { LoginButton } from "./LoginButton";

export function LoginPanel() {
	const { authError } = useAuth();

	return (
		<PanelWrapper data-testid="login-panel">
			<Center h="400px">
				<Stack align="center" gap="lg">
					<Title order={2}>Todoist Nest Filtered View</Title>
					<Text c="dimmed" ta="center">
						Todoistアカウントでログインして、
						<br />
						タスクを管理しましょう
					</Text>

					{authError && (
						<Alert
							icon={<IconAlertCircle size={16} />}
							title="認証エラー"
							color="red"
							data-testid="auth-error"
						>
							{authError}
						</Alert>
					)}

					<LoginButton />
				</Stack>
			</Center>
		</PanelWrapper>
	);
}
