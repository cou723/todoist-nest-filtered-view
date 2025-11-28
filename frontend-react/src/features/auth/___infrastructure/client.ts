import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import type { RpcClientError } from "@effect/rpc/RpcClientError";
import { Effect, Layer } from "effect";
import * as Fiber from "effect/Fiber";
import { getEnv } from "../../env/__application";
import { type ProxyError, ProxyRpc } from "./api";

const { VITE_PROXY_URL } = getEnv();
const DEFAULT_PROXY_URL = VITE_PROXY_URL;

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

type ProxyClient = RpcClient.FromGroup<typeof ProxyRpc, RpcClientError>;
type ProxyClientFiber = Fiber.RuntimeFiber<ProxyClient, never>;

class ProxyRpcClient {
	private baseUrl: string;
	private clientFiber: ProxyClientFiber | null = null;

	constructor(baseUrl: string) {
		this.baseUrl = normalizeBaseUrl(baseUrl);
	}

	setBaseUrl(url: string) {
		const normalized = normalizeBaseUrl(url);
		if (normalized === this.baseUrl) {
			return;
		}
		this.baseUrl = normalized;
	}

	private makeClient() {
		return RpcClient.make(ProxyRpc).pipe(
			Effect.provide(
				RpcClient.layerProtocolHttp({
					url: `${this.baseUrl}/rpc`,
				}).pipe(
					Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
				),
			),
			Effect.scoped,
		);
	}

	private getClientFiber(): ProxyClientFiber {
		if (this.clientFiber === null) {
			this.clientFiber = Effect.runFork(this.makeClient());
		}
		return this.clientFiber;
	}

	getClient() {
		return Effect.runPromise(Fiber.join(this.getClientFiber()));
	}
}

let proxyRpcClient: ProxyRpcClient | null = null;
let proxyRpcBaseUrl = normalizeBaseUrl(DEFAULT_PROXY_URL);

const ensureProxyRpcClient = () => {
	if (proxyRpcClient === null) {
		proxyRpcClient = new ProxyRpcClient(proxyRpcBaseUrl);
	}
	return proxyRpcClient;
};

export const setProxyRpcBaseUrl = (url: string) => {
	proxyRpcBaseUrl = normalizeBaseUrl(url);
	proxyRpcClient?.setBaseUrl(proxyRpcBaseUrl);
};

export type ProxyRpcExecutor<A> = (
	client: ProxyClient,
) => Effect.Effect<A, ProxyError | RpcClientError>;

export const callProxyRpc = async <A>(
	executor: ProxyRpcExecutor<A>,
): Promise<A> => {
	const client = await ensureProxyRpcClient().getClient();
	return Effect.runPromise(executor(client));
};
