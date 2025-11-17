/**
 * AuthService - Effect-based OAuth authentication service
 * 
 * Provides Effect-based methods for OAuth authentication flow with Todoist.
 */

import { Effect } from "effect";
import { OAuthTokenResponseSchema, type OAuthTokenResponse } from "../todoist/schema.js";
import { post, postNoContent } from "../http/client.js";
import type { TodoistErrorUnion } from "../errors/todoist-errors.js";

/**
 * AuthService interface
 */
export interface AuthService {
  /**
   * Exchange authorization code for access token
   */
  readonly exchangeCodeForToken: (
    code: string,
    clientId: string,
    redirectUri: string
  ) => Effect.Effect<OAuthTokenResponse, TodoistErrorUnion, never>;
  
  /**
   * Revoke an access token
   */
  readonly revokeToken: (
    accessToken: string,
    clientId: string
  ) => Effect.Effect<void, TodoistErrorUnion, never>;
}

/**
 * AuthService configuration
 */
export interface AuthServiceConfig {
  readonly proxyUrl: string;
}

/**
 * Create AuthService implementation
 */
export const makeAuthService = (config: AuthServiceConfig): AuthService => {
  return {
    exchangeCodeForToken: (code: string, clientId: string, redirectUri: string) =>
      post(
        config.proxyUrl,
        "/oauth/token",
        OAuthTokenResponseSchema,
        {
          client_id: clientId,
          code,
          redirect_uri: redirectUri,
        }
      ),
    
    revokeToken: (accessToken: string, clientId: string) =>
      postNoContent(
        config.proxyUrl,
        "/oauth/revoke",
        {
          client_id: clientId,
          access_token: accessToken,
        }
      ),
  };
};
