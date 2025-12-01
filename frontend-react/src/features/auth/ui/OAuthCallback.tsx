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
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/ui";

export function OAuthCallback() {
	const { processOAuthCallback, isAuthenticated, authError, isLoading } =
		useAuth();
	const handledRef = useRef(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (handledRef.current) return;
		handledRef.current = true;
		processOAuthCallback(window.location.href);
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
				{isLoading && <Loader color="red" size="lg" />}
				<Text size="sm" c="dimmed">
					Todoist からの応答を確認しています
				</Text>

				{errorMessage && (
					<Alert
						icon={<IconAlertCircle size={16} />}
						title="OAuth エラー"
						color="red"
					>
						<Stack gap={"xs"}>
							{errorMessage}
							<Button
								mt="sm"
								variant="default"
								onClick={() => window.location.assign("/")}
							>
								ログイン画面に戻る
							</Button>
						</Stack>
					</Alert>
				)}
			</Stack>
		</Center>
	);
}
