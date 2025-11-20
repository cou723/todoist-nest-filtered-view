/**
 * OAuthCallback - OAuthリダイレクト後のコールバック処理を行うコンポーネント
 */

import { Center, Loader, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { useAuth } from "../../shared/auth";

export function OAuthCallback() {
	const { handleOAuthCallback, isProcessingAuth } = useAuth();

	useEffect(() => {
		// URLからcodeとstateを取得
		const params = new URLSearchParams(window.location.search);
		const code = params.get("code");
		const state = params.get("state");

		if (code && state) {
			// OAuth コールバック処理を実行
			handleOAuthCallback(code, state);

			// URLパラメータをクリア（履歴に残さないため）
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, [handleOAuthCallback]);

	if (isProcessingAuth) {
		return (
			<Center h="400px">
				<Stack align="center" gap="md">
					<Loader size="xl" />
					<Text c="dimmed">認証処理中...</Text>
				</Stack>
			</Center>
		);
	}

	return null;
}
