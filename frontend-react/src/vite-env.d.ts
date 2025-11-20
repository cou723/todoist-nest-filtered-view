/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_TODOIST_CLIENT_ID: string;
	readonly VITE_REDIRECT_URI: string;
	readonly VITE_PROXY_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
