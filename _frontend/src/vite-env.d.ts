/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TODOIST_CLIENT_ID: string | undefined;
  readonly VITE_TODOIST_CLIENT_SECRET: string | undefined;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
