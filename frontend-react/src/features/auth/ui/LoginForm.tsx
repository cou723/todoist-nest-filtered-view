/**
 * LoginForm - Todoist OAuth ログイン UI（手動入力はデバッグ用のフォールバック）
 */

import {
	Alert,
	Button,
	Container,
	Paper,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconAlertCircle, IconShieldLock } from "@tabler/icons-react";

interface LoginFormProps {
	onOAuth: () => void;
	isLoading: boolean;
	error?: string | null;
}

export function LoginForm({ onOAuth, isLoading, error }: LoginFormProps) {
	return (
		<Container size="xs" style={{ marginTop: "10vh" }}>
			<Paper p="xl" shadow="md" radius="md">
				<Stack gap="lg">
					<div style={{ textAlign: "center" }}>
						<IconShieldLock
							size={48}
							stroke={1.5}
							style={{ margin: "0 auto" }}
						/>
						<Title order={2} mt="md">
							Todoist Nest Filtered View
						</Title>
						<Text c="dimmed" size="sm" mt="xs">
							Todoist でログインして開始してください
						</Text>
					</div>

					<Button onClick={onOAuth} loading={isLoading} fullWidth size="md">
						Todoistでログイン
					</Button>

					{error && (
						<Alert
							icon={<IconAlertCircle size={16} />}
							title="認証エラー"
							color="red"
						>
							{error}
						</Alert>
					)}
				</Stack>
			</Paper>
		</Container>
	);
}
