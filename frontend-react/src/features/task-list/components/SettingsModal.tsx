/**
 * SettingsModal component - filter configuration modal
 */

import { Button, Checkbox, Modal, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

interface SettingsModalProps {
	opened: boolean;
	onClose: () => void;
	filterQuery: string;
	hideDepTasks: boolean;
	onFilterQueryChange: (query: string) => void;
	onHideDepTasksChange: (hide: boolean) => void;
}

export function SettingsModal({
	opened,
	onClose,
	filterQuery,
	hideDepTasks,
	onFilterQueryChange,
	onHideDepTasksChange,
}: SettingsModalProps) {
	const [localFilterQuery, setLocalFilterQuery] = useState(filterQuery);
	const [localHideDepTasks, setLocalHideDepTasks] = useState(hideDepTasks);

	// Sync local state when props change (modal opens)
	useEffect(() => {
		if (opened) {
			setLocalFilterQuery(filterQuery);
			setLocalHideDepTasks(hideDepTasks);
		}
	}, [opened, filterQuery, hideDepTasks]);

	// Apply changes and close
	const handleApply = () => {
		onFilterQueryChange(localFilterQuery);
		onHideDepTasksChange(localHideDepTasks);
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="フィルター設定"
			centered
			size="md"
		>
			<Stack gap="md">
				<TextInput
					label="フィルタクエリ"
					placeholder="例: today, p1, @label_name など"
					value={localFilterQuery}
					onChange={(event) => setLocalFilterQuery(event.currentTarget.value)}
					description="Todoistのフィルタ構文を使用できます"
				/>

				<Checkbox
					label="dep-系ラベルを持つ依存タスクを非表示"
					checked={localHideDepTasks}
					onChange={(event) =>
						setLocalHideDepTasks(event.currentTarget.checked)
					}
				/>

				<Button onClick={handleApply} fullWidth>
					適用
				</Button>
			</Stack>
		</Modal>
	);
}
