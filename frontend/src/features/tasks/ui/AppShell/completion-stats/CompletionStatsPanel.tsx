import {
	Alert,
	Group,
	Loader,
	type MantineTheme,
	SimpleGrid,
	Stack,
	Text,
	Title,
	useComputedColorScheme,
	useMantineTheme,
} from "@mantine/core";
import { ResponsiveLine } from "@nivo/line";
import { format } from "date-fns";
import { useMemo } from "react";
import { PanelWrapper } from "@/features/tasks/ui";
import { useCompletionStatsPanel } from "./useCompletionStatsPanel";

const formatDateLabel = (date: Date) => format(date, "M/d");

function SummaryItem({ label, value }: { label: string; value: string }) {
	return (
		<Stack gap={2} p="xs" style={{ borderRadius: 8 }}>
			<Text size="xs" c="dimmed">
				{label}
			</Text>
			<Text fw={700}>{value}</Text>
		</Stack>
	);
}

export function CompletionStatsPanel() {
	const theme = useMantineTheme();
	const { stats, remainingCount, status, error } = useCompletionStatsPanel();

	const isLoading = status === "loading";
	const hasData =
		Boolean(stats) &&
		((stats?.summary.last90DaysTotal ?? 0) > 0 ||
			(stats?.summary.todayCount ?? 0) > 0);

	const { chartData, tickValues } = useMemo(() => {
		if (!stats) {
			return { chartData: [], tickValues: [] };
		}

		const labels = stats.daily.map((point) => formatDateLabel(point.date));

		return {
			chartData: [
				{
					id: "日次件数",
					data: stats.daily.map((point, index) => ({
						x: labels[index],
						y: point.count,
					})),
				},
				{
					id: "7日移動平均",
					data: stats.daily.map((point, index) => ({
						x: labels[index],
						y: Number(point.movingAverage.toFixed(2)),
					})),
				},
			],
			tickValues: labels.filter(
				(_, index) =>
					index % 7 === 0 || index === Math.max(0, labels.length - 1),
			),
		};
	}, [stats]);

	return (
		<PanelWrapper data-testid="completion-stats-panel">
			<Stack gap="md">
				<Title order={3}>ワークタスク完了統計</Title>

				{error ? (
					<Alert color="red" variant="light">
						{error}
					</Alert>
				) : null}

				{isLoading ? (
					<Group gap="xs">
						<Loader size="sm" />
						<Text c="dimmed" size="sm">
							読み込み中...
						</Text>
					</Group>
				) : null}

				{!isLoading && !error && stats ? (
					<Stack gap="md">
						<SimpleGrid cols={{ base: 2, xs: 3, sm: 5, md: 5 }} spacing="sm">
							<SummaryItem
								label="90日合計"
								value={`${stats.summary.last90DaysTotal}件`}
							/>
							<SummaryItem
								label="当日件数"
								value={`${stats.summary.todayCount}件`}
							/>
							<SummaryItem
								label="直近7日平均"
								value={`${stats.summary.last7DaysAverage.toFixed(1)}件`}
							/>
							<SummaryItem
								label="直近7日合計"
								value={`${stats.summary.last7DaysTotal}件`}
							/>
							<SummaryItem
								label="@task 残数"
								value={remainingCount === null ? "—" : `${remainingCount}件`}
							/>
						</SimpleGrid>

						{hasData ? (
							<Graph
								chartData={chartData}
								tickValues={tickValues}
								theme={theme}
							/>
						) : (
							<Text c="dimmed" size="sm">
								完了統計データがありません
							</Text>
						)}
					</Stack>
				) : null}
			</Stack>
		</PanelWrapper>
	);
}
function Graph({
	chartData,
	tickValues,
	theme,
}: {
	chartData: { id: string; data: { x: string; y: number }[] }[];
	tickValues: string[];
	theme: MantineTheme;
}) {
	const colorScheme = useComputedColorScheme("light");
	const chartTheme = createChartTheme(colorScheme === "dark", theme);

	return (
		<div style={{ height: 280 }}>
			<ResponsiveLine
				data={chartData}
				margin={{ top: 8, right: 16, bottom: 48, left: 48 }}
				xScale={{ type: "point" }}
				yScale={{
					type: "linear",
					min: 0,
					max: "auto",
					stacked: false,
				}}
				axisBottom={{
					tickSize: 0,
					tickPadding: 10,
					tickRotation: -5,
					tickValues,
				}}
				axisLeft={{
					tickSize: 0,
					tickPadding: 8,
				}}
				enablePoints={false}
				useMesh
				colors={[theme.colors.blue[6], theme.colors.orange[6]]}
				lineWidth={3}
				enableArea={false}
				theme={chartTheme}
				legends={[
					{
						anchor: "bottom",
						direction: "row",
						justify: false,
						translateY: 40,
						itemsSpacing: 12,
						itemDirection: "left-to-right",
						itemWidth: 110,
						itemHeight: 18,
						symbolSize: 12,
						symbolShape: "circle",
					},
				]}
			/>
		</div>
	);
}
function createChartTheme(isDark: boolean, theme: MantineTheme) {
	const chartTextColor = isDark ? theme.colors.gray[2] : theme.colors.gray[7];
	const chartGridColor = isDark ? theme.colors.dark[4] : theme.colors.gray[3];
	const axisColor = isDark ? theme.colors.gray[3] : theme.colors.gray[6];
	const crosshairColor = isDark ? theme.colors.blue[3] : theme.colors.blue[7];
	const tooltipBackground = isDark ? theme.colors.dark[7] : theme.white;
	const tooltipTextColor = isDark ? theme.colors.gray[0] : theme.colors.gray[9];
	const tooltipBorderColor = isDark
		? theme.colors.dark[4]
		: theme.colors.gray[4];

	return {
		background: "transparent",
		text: {
			fill: chartTextColor,
		},
		axis: {
			domain: {
				line: {
					stroke: axisColor,
					strokeWidth: 1,
				},
			},
			ticks: {
				line: {
					stroke: axisColor,
					strokeWidth: 1,
				},
				text: {
					fill: chartTextColor,
				},
			},
			legend: {
				text: {
					fill: chartTextColor,
				},
			},
		},
		grid: {
			line: {
				stroke: chartGridColor,
				strokeWidth: 1,
			},
		},
		legends: {
			text: {
				fill: chartTextColor,
			},
		},
		crosshair: {
			line: {
				stroke: crosshairColor,
				strokeWidth: 1,
				strokeOpacity: 0.7,
			},
		},
		tooltip: {
			container: {
				background: tooltipBackground,
				color: tooltipTextColor,
				border: `1px solid ${tooltipBorderColor}`,
				borderRadius: 8,
				boxShadow: theme.shadows.sm,
			},
		},
	};
}
