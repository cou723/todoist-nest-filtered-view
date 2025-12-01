import { Schema } from "effect";

const EnvSchema = Schema.Struct({
  ALLOWED_ORIGIN: Schema.String,
  TODOIST_CLIENT_SECRET: Schema.String,
});

export const env = Schema.decodeUnknownSync(EnvSchema)(Deno.env.toObject());
