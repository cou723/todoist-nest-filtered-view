import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			// todoist-api-typescript がブラウザ向けでも Node の fs/path/form-data に依存しており、そのままでは Vite がビルドで落ちるためスタブへ差し替える
			fs: resolve(__dirname, "./src/shims/fs.ts"),
			path: resolve(__dirname, "./src/shims/path.ts"),
			"form-data": resolve(__dirname, "./src/shims/form-data.ts"),
		},
	},
});
