/**
 * CompletionStatsPanel - 完了統計パネル
 *
 * 過去90日間の作業完了統計と7日移動平均を表示します。
 */

import { Button, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { PanelWrapper } from "../../shared/components/PanelWrapper";
import {
	useCompletionStats,
	useRemainingTaskCount,
} from "./useCompletionStats";

export function CompletionStatsPanel() {
	const {
		data: statsData,
		isLoading: statsLoading,
		error: statsError,
		refetch: refetchStats,
	} = useCompletionStats();

	const {
		data: remainingCount,
		isLoading: countLoading,
		error: countError,
		refetch: refetchCount,
	} = useRemainingTaskCount();

	const handleRefresh = () => {
		refetchStats();
		refetchCount();
	};

	// ローディング中
	if (statsLoading || countLoading) {
		return (
			<PanelWrapper data-testid="completion-stats-panel">
				<Stack gap="md" align="center">
					<Title order={3}>完了統計</Title>
					<Loader size="md" />
					<Text c="dimmed">読み込み中...</Text>
				</Stack>
			</PanelWrapper>
		);
	}

	// エラー発生
	if (statsError || countError) {
		return (
			<PanelWrapper data-testid="completion-stats-panel">
				<Stack gap="md">
					<Title order={3}>完了統計</Title>
					<Text c="red">
						{statsError
							? "完了統計の取得に失敗しました"
							: "残りタスク数の取得に失敗しました"}
					</Text>
				</Stack>
			</PanelWrapper>
		);
	}

	// データなし
	if (!statsData || statsData.dailyStats.length === 0) {
		return (
			<PanelWrapper data-testid="completion-stats-panel">
				<Stack gap="md">
					<Title order={3}>完了統計</Title>
					<Text c="dimmed">完了統計データがありません</Text>
				</Stack>
			</PanelWrapper>
		);
	}

	// グラフ用データの準備
	const chartData = statsData.dailyStats.map((stat, index) => ({
		date: stat.displayDate,
		"7日平均": statsData.sevenDayAverages[index]
			? Number(statsData.sevenDayAverages[index].toFixed(1))
			: 0,
	}));

	return (
		<PanelWrapper data-testid="completion-stats-panel">
			<Stack gap="md">
				{/* ヘッダー */}
				<Group justify="space-between" align="center">
					<Title order={3}>完了統計</Title>
					<Button
						variant="light"
						size="xs"
						leftSection={<IconRefresh size={14} />}
						onClick={handleRefresh}
					>
						データを取得しなおす
					</Button>
				</Group>

				{/* サマリー統計 */}
				<Group gap="lg" grow>
					<Stack gap={4} align="center" style={{ flex: 1 }}>
						<Text size="xs" c="dimmed">
							過去90日間合計
						</Text>
						<Text size="xl" fw={700}>
							{statsData.totalCount}件
						</Text>
					</Stack>
					<Stack gap={4} align="center" style={{ flex: 1 }}>
						<Text size="xs" c="dimmed">
							残り@task数
						</Text>
						<Text size="xl" fw={700}>
							{remainingCount ?? 0}件
						</Text>
					</Stack>
				</Group>

				{/* グラフ */}
				<div style={{ width: "100%", height: 250 }}>
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={chartData}
							margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
						>
							<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
							<XAxis
								dataKey="date"
								tick={{ fontSize: 12 }}
								interval="preserveStartEnd"
							/>
							<YAxis
								tick={{ fontSize: 12 }}
								label={{ value: "件数", angle: -90, position: "insideLeft" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "var(--mantine-color-body)",
									border: "1px solid var(--mantine-color-default-border)",
									borderRadius: "4px",
								}}
							/>
							<Legend />
							<Line
								type="monotone"
								dataKey="7日平均"
								stroke="#ff6b35"
								strokeWidth={2}
								strokeDasharray="5 5"
								dot={{ r: 3 }}
								activeDot={{ r: 5 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</Stack>
		</PanelWrapper>
	);
}
