/**
 * LoginForm - Todoist access_token 入力フォーム
 */

import {
	Alert,
	Button,
	Container,
	Paper,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { IconAlertCircle, IconKey } from "@tabler/icons-react";
import { useState } from "react";

interface LoginFormProps {
	onLogin: (token: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
	const [token, setToken] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		const trimmedToken = token.trim();

		if (!trimmedToken) {
			setError("アクセストークンを入力してください");
			return;
		}

		// 基本的なバリデーション（Todoist トークンは通常40文字）
		if (trimmedToken.length < 20) {
			setError(
				"トークンが短すぎます。正しいアクセストークンを入力してください",
			);
			return;
		}

		onLogin(trimmedToken);
	};

	return (
		<Container size="xs" style={{ marginTop: "10vh" }}>
			<Paper p="xl" shadow="md" radius="md">
				<Stack gap="lg">
					<div style={{ textAlign: "center" }}>
						<IconKey size={48} stroke={1.5} style={{ margin: "0 auto" }} />
						<Title order={2} mt="md">
							Todoist Nest Filtered View
						</Title>
						<Text c="dimmed" size="sm" mt="xs">
							Todoistのアクセストークンを入力してください
						</Text>
					</div>

					<form onSubmit={handleSubmit}>
						<Stack gap="md">
							<TextInput
								label="Todoist Access Token"
								placeholder="あなたのアクセストークンを入力"
								value={token}
								onChange={(e) => setToken(e.currentTarget.value)}
								required
								type="password"
								autoComplete="off"
							/>

							{error && (
								<Alert
									icon={<IconAlertCircle size={16} />}
									title="エラー"
									color="red"
								>
									{error}
								</Alert>
							)}

							<Button type="submit" fullWidth>
								ログイン
							</Button>
						</Stack>
					</form>
				</Stack>
			</Paper>
		</Container>
	);
}
