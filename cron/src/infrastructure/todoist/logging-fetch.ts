import type { CustomFetch, CustomFetchResponse } from "todoist";

/**
 * Fetch関数をラップしてリクエスト・レスポンスをロギングするカスタムfetch実装
 */
export function createLoggingFetch(): CustomFetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<CustomFetchResponse> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || "GET";
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] → ${method} ${url}`);

    // リクエストボディをログ出力（存在する場合）
    if (init?.body) {
      try {
        const bodyText = typeof init.body === "string" ? init.body : JSON.stringify(init.body);
        console.log(`[${timestamp}] Request body:`, bodyText);
      } catch (error) {
        console.log(`[${timestamp}] Request body: [Unable to serialize]`);
      }
    }

    const startTime = performance.now();

    try {
      const response = await fetch(input, init);
      const duration = Math.round(performance.now() - startTime);

      console.log(`[${timestamp}] ← ${response.status} ${response.statusText} (${duration}ms)`);

      // Convert standard Response to CustomFetchResponse
      const headersRecord: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersRecord[key] = value;
      });

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: headersRecord,
        json: () => response.json(),
        text: () => response.text(),
      };
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      console.error(`[${timestamp}] ✗ Request failed (${duration}ms):`, error);
      throw error;
    }
  };
}
