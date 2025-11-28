import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import type { RpcClientError } from "@effect/rpc/RpcClientError";
import { Effect, Layer } from "effect";
import { getEnvImpl as getEnv } from "../../env/___infrastructure";
import { type ProxyError, ProxyRpc } from "./api";

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

type ProxyClient = RpcClient.FromGroup<typeof ProxyRpc, RpcClientError>;

const makeProxyClient = (baseUrl: string) =>
	RpcClient.make(ProxyRpc).pipe(
		Effect.provide(
			RpcClient.layerProtocolHttp({
				url: `${normalizeBaseUrl(baseUrl)}/rpc`,
			}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson])),
		),
		Effect.scoped,
	);

// getEnvを依存性注入したほうがテスタビリティは高いが、callProxyRpc単体のテストは基本しないので、ここでは直接呼び出す。
const { VITE_PROXY_URL } = getEnv();
const DEFAULT_PROXY_URL = normalizeBaseUrl(VITE_PROXY_URL);

export type ProxyRpcExecutor<A> = (
	client: ProxyClient,
) => Effect.Effect<A, ProxyError | RpcClientError>;

export const callProxyRpc = <A>(
	executor: ProxyRpcExecutor<A>,
	baseUrl: string = DEFAULT_PROXY_URL,
): Effect.Effect<A, ProxyError | RpcClientError> =>
	Effect.gen(function* () {
		const client = yield* makeProxyClient(baseUrl);
		return yield* executor(client);
	});
