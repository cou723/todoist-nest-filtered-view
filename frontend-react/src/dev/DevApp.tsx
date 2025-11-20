/**
 * DevApp - Development app for UI screenshots with mock data
 */

import { Container, MantineProvider, Stack, Title } from "@mantine/core";
import "@mantine/core/styles.css";
import { MockTaskListPanel } from "./MockTaskListPanel";

export function DevApp() {
	return (
		<MantineProvider>
			<Container size="xl" py="xl">
				<Stack gap="lg">
					<Title order={1}>Todoist タスク管理</Title>
					<MockTaskListPanel />
				</Stack>
			</Container>
		</MantineProvider>
	);
}
