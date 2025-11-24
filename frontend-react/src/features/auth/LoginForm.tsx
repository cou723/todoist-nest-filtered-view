/**
 * LoginForm - Todoist OAuth ログイン UI（手動入力はデバッグ用のフォールバック）
 */

import {
	Alert,
	Anchor,
	Button,
	Collapse,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconAlertCircle, IconShieldLock } from "@tabler/icons-react";
import { useState } from "react";

interface LoginFormProps {
	onOAuth: () => void;
	onManualLogin: (token: string) => void;
	isLoading: boolean;
	error?: string | null;
}

export function LoginForm({
	onOAuth,
	onManualLogin,
	isLoading,
	error,
}: LoginFormProps) {
	const [token, setToken] = useState("");
	const [showManual, setShowManual] = useState(false);
	const [manualError, setManualError] = useState("");

	const handleManualSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setManualError("");

		const trimmed = token.trim();
		if (!trimmed) {
			setManualError("アクセストークンを入力してください");
			return;
		}

		onManualLogin(trimmed);
	};

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

					{(error || manualError) && (
						<Alert
							icon={<IconAlertCircle size={16} />}
							title="認証エラー"
							color="red"
						>
							{error ?? manualError}
						</Alert>
					)}

					<Group justify="space-between" gap="xs">
						<Text size="xs" c="dimmed">
							デバッグ用のアクセストークン手動入力
						</Text>
						<Anchor size="xs" onClick={() => setShowManual((prev) => !prev)}>
							{showManual ? "閉じる" : "開く"}
						</Anchor>
					</Group>

					<Collapse in={showManual}>
						<form onSubmit={handleManualSubmit}>
							<Stack gap="md">
								<TextInput
									label="Todoist Access Token"
									placeholder="デバッグ用に直接入力"
									value={token}
									onChange={(e) => setToken(e.currentTarget.value)}
									type="password"
									autoComplete="off"
								/>
								<Button type="submit" variant="light" fullWidth>
									トークンを保存
								</Button>
							</Stack>
						</form>
					</Collapse>
				</Stack>
			</Paper>
		</Container>
	);
}
