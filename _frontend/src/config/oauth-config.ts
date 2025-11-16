import type { Permission } from "@doist/todoist-api-typescript/dist/authentication.js";
import type { OAuthConfig } from "../services/oauth-service.js";

const clientId = import.meta.env.VITE_TODOIST_CLIENT_ID;

if (!clientId) {
  throw new Error("VITE_TODOIST_CLIENT_ID environment variable is required");
}

// TodoistのSDKのPermission型を使用してより型安全に
const permissions: Permission[] = ["data:read_write"];

export const OAUTH_CONFIG: OAuthConfig = {
  clientId,
  redirectUri: window.location.origin + "/",
  permissions,
};

export function getOAuthConfig(): OAuthConfig {
  return OAUTH_CONFIG;
}
