import { Schema as S } from "effect";

const ConsumerTypeSchema = S.Literal("tui", "headless", "none");
export type ConsumerType = typeof ConsumerTypeSchema.Type;
