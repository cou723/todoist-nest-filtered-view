import {
	FetchHttpClient,
	Headers,
	HttpClient,
	HttpClientRequest,
} from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import type { RpcClientError } from "@effect/rpc/RpcClientError";
import { Effect, Layer } from "effect";
import { type ProxyError, ProxyRpc } from "@/features/auth/infrastructure/api";
import { getEnvImpl as getEnv } from "@/features/env";

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

type ProxyClient = RpcClient.FromGroup<typeof ProxyRpc, RpcClientError>;

const stripTracingHeaders = (request: HttpClientRequest.HttpClientRequest) => {
	const headers = Headers.remove(request.headers, [
		"traceparent",
		"tracestate",
		"b3",
	]);
	return HttpClientRequest.setHeaders(request, headers);
};

const makeProxyClient = (baseUrl: string) =>
	RpcClient.make(ProxyRpc).pipe(
		Effect.provide(
			RpcClient.layerProtocolHttp({
				url: `${normalizeBaseUrl(baseUrl)}/rpc`,
				transformClient: (client) =>
					client.pipe(
						// トレースヘッダーを付与しない
						HttpClient.withTracerPropagation(false),
						// ブラウザ拡張等で付与された場合も念のため除去
						HttpClient.mapRequest(stripTracingHeaders),
					),
			}).pipe(
				Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
			),
		),
	);

// getEnvを依存性注入したほうがテスタビリティは高いが、callProxyRpc単体のテストはcallProxyRpcがeffect/rpcの薄いラップのため、効果が薄いためここでは直接呼び出す。
const { VITE_PROXY_URL } = getEnv();
const DEFAULT_PROXY_URL = normalizeBaseUrl(VITE_PROXY_URL);

export type ProxyRpcExecutor<A> = (
	client: ProxyClient,
) => Effect.Effect<A, ProxyError | RpcClientError>;

export const callProxyRpc = <A>(
	executor: ProxyRpcExecutor<A>,
	baseUrl: string = DEFAULT_PROXY_URL,
): Effect.Effect<A, ProxyError | RpcClientError> =>
	Effect.scoped(
		Effect.gen(function* () {
			const client = yield* makeProxyClient(baseUrl);
			// スコープが閉じるとリクエスト実行中のファイバーが中断されるため、ここでスコープを保持する
			return yield* executor(client);
		}),
	);
