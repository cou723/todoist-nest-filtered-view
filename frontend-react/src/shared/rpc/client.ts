import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Effect, Layer } from "effect";
import { type ProxyError, ProxyRpc } from "./api";

const DEFAULT_PROXY_URL =
	import.meta.env.VITE_PROXY_URL ??
	"http://localhost:8000";

let proxyRpcBaseUrl = DEFAULT_PROXY_URL.replace(/\/$/, "");

let proxyClientPromise: Promise<RpcClient.FromGroup<typeof ProxyRpc>> | null = null;

const createProtocolLayer = () =>
	RpcClient.layerProtocolHttp({
		url: `${proxyRpcBaseUrl}/rpc`,
	}).pipe(
		Layer.provide([
			FetchHttpClient.layer,
			RpcSerialization.layerNdjson,
		]),
	);

const makeClient = () =>
	RpcClient.make(ProxyRpc)
		.pipe(Effect.provide(createProtocolLayer()), Effect.scoped);

export const setProxyRpcBaseUrl = (url: string) => {
	const normalized = url.replace(/\/$/, "");
	if (normalized !== proxyRpcBaseUrl) {
		proxyRpcBaseUrl = normalized;
		proxyClientPromise = null;
	}
};

export const getProxyRpcClient = (): Promise<RpcClient.FromGroup<typeof ProxyRpc>> => {
	if (!proxyClientPromise) {
		proxyClientPromise = Effect.runPromise(makeClient());
	}
	return proxyClientPromise;
};

export const callProxyRpc = async <A>(
	executor: (
		client: RpcClient.FromGroup<typeof ProxyRpc>,
	) => Effect.Effect<A, ProxyError>,
): Promise<A> => {
	const client = await getProxyRpcClient();
	return Effect.runPromise(executor(client));
};
