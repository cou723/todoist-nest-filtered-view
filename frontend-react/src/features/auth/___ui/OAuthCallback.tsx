import {
	Alert,
	Button,
	Center,
	Loader,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function OAuthCallback() {
	const { processOAuthCallback, isAuthenticated, authError } = useAuth();
	const handledRef = useRef(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (handledRef.current) return;
		handledRef.current = true;
		processOAuthCallback(window.location.href)
	}, [processOAuthCallback]);

	useEffect(() => {
		if (isAuthenticated) {
			navigate("/", { replace: true });
		}
	}, [isAuthenticated, navigate]);

	const errorMessage = authError;

	return (
		<Center style={{ minHeight: "100vh" }}>
			<Stack align="center" gap="md">
				<Title order={3}>認証処理中...</Title>
				<Loader color="red" size="lg" />
				<Text size="sm" c="dimmed">
					Todoist からの応答を確認しています
				</Text>

				{errorMessage && (
					<Alert
						icon={<IconAlertCircle size={16} />}
						title="OAuth エラー"
						color="red"
					>
						{errorMessage}
						<Button
							mt="sm"
							variant="light"
							onClick={() => window.location.assign("/")}
						>
							ログイン画面に戻る
						</Button>
					</Alert>
				)}
			</Stack>
		</Center>
	);
}
