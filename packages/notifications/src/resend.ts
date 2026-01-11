import { env } from "@ferix/env/convex";
import { Resend } from "resend";

export const resend = new Resend(env.RESEND_API_KEY);
export const FROM_EMAIL = "Ferix <noreply@ferix.ai>";
