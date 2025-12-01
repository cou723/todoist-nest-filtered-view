// todoist-api-typescript の path.basename 依存をブラウザ向けに最小限エミュレートするスタブ
export const basename = (filePath: string): string => {
	const normalized = filePath.replace(/\\/g, "/");
	const segments = normalized.split("/");
	return segments.at(-1) ?? "";
};
