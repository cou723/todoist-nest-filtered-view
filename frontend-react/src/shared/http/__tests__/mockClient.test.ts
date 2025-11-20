/**
 * モック HTTP クライアントのテスト
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { TodoistHttpClient } from "../client";
import { FIXTURE_COMPLETED_TASKS, FIXTURE_TASKS } from "../fixtures";
import { TodoistHttpClientMock } from "../mockClient";

describe("TodoistHttpClientMock", () => {
	describe("get", () => {
		it("全タスクを取得する", async () => {
			const mockLayer = TodoistHttpClientMock();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const client = yield* TodoistHttpClient;
					return yield* client.get("/tasks");
				}).pipe(Effect.provide(mockLayer)),
			);

			expect(result).toEqual(FIXTURE_TASKS);
		});

		it("フィルタ付きでタスクを取得する", async () => {
			const mockLayer = TodoistHttpClientMock();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const client = yield* TodoistHttpClient;
					return yield* client.get("/tasks?filter=@goal");
				}).pipe(Effect.provide(mockLayer)),
			);

			const expected = FIXTURE_TASKS.filter((task) =>
				task.labels.includes("goal"),
			);
			expect(result).toEqual(expected);
		});

		it("単一タスクを ID で取得する", async () => {
			const mockLayer = TodoistHttpClientMock();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const client = yield* TodoistHttpClient;
					return yield* client.get("/tasks/7495833149");
				}).pipe(Effect.provide(mockLayer)),
			);

			expect(result).toEqual(FIXTURE_TASKS[0]);
		});

		it("完了済みタスクを取得する", async () => {
			const mockLayer = TodoistHttpClientMock();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const client = yield* TodoistHttpClient;
					return yield* client.get(
						"/v1/tasks/completed/by_completion_date?since=2024-01-01T00:00:00Z&until=2024-01-31T23:59:59Z",
					);
				}).pipe(Effect.provide(mockLayer)),
			);

			expect(result).toEqual(FIXTURE_COMPLETED_TASKS);
		});
	});

	describe("post", () => {
		it("タスクを完了する", async () => {
			const mockLayer = TodoistHttpClientMock();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const client = yield* TodoistHttpClient;
					return yield* client.post("/tasks/7495833149/close");
				}).pipe(Effect.provide(mockLayer)),
			);

			expect(result).toBeNull();
		});

		it("OAuth トークンを交換する", async () => {
			const mockLayer = TodoistHttpClientMock();

			const result = await Effect.runPromise(
				Effect.gen(function* () {
					const client = yield* TodoistHttpClient;
					return yield* client.post("/oauth/token", {
						client_id: "test",
						code: "test_code",
					});
				}).pipe(Effect.provide(mockLayer)),
			);

			expect(result).toHaveProperty("access_token");
			expect(result).toHaveProperty("token_type", "Bearer");
		});
	});

	describe("delete", () => {
		it("削除リクエストが成功する", async () => {
			const mockLayer = TodoistHttpClientMock();

			await expect(
				Effect.runPromise(
					Effect.gen(function* () {
						const client = yield* TodoistHttpClient;
						return yield* client.delete("/tasks/7495833149");
					}).pipe(Effect.provide(mockLayer)),
				),
			).resolves.toBeUndefined();
		});
	});
});
