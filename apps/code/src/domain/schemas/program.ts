import { Schema as S } from "effect";
import { LoopConfigSchema } from "./config.js";

export const ConsumerTypeSchema = S.Literal("tui", "headless", "none");
export type ConsumerType = typeof ConsumerTypeSchema.Type;

// Note: RunOptions contains a callback (onEvent) which can't be a schema
// So we define a partial schema for the serializable parts
export const RunOptionsDataSchema = S.Struct({
  config: LoopConfigSchema,
  consumer: S.optional(ConsumerTypeSchema),
});
export type RunOptionsData = typeof RunOptionsDataSchema.Type;
