/**
 * LogoutButton - ログアウトボタンコンポーネント
 */

import { ActionIcon, Tooltip } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useAuth } from "../../shared/auth";

export function LogoutButton() {
	const { logout } = useAuth();

	return (
		<Tooltip label="ログアウト">
			<ActionIcon
				variant="default"
				size="lg"
				onClick={logout}
				aria-label="Logout"
				data-testid="logout-button"
			>
				<IconLogout size={18} />
			</ActionIcon>
		</Tooltip>
	);
}
