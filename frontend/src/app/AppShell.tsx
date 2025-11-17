import { Container, Stack, Text, Title } from "@mantine/core";

export function AppShell() {
	return (
		<Container size="xl" py="xl">
			<Stack gap="md">
				<Title order={1}>Todoist Nest Filtered View</Title>
				<Text size="lg" c="dimmed">
					フロントエンド Phase 1 - プロジェクトセットアップ完了
				</Text>
				<Text>
					このアプリケーションは、Todoistのタスク構造を可視化し、進捗を追跡するためのツールです。
				</Text>
			</Stack>
		</Container>
	);
}
