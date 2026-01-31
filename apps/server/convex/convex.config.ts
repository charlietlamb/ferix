import migrations from "@convex-dev/migrations/convex.config";
import workpool from "@convex-dev/workpool/convex.config";
import { defineApp } from "convex/server";
import betterAuth from "./betterAuth/convex.config";

const app: ReturnType<typeof defineApp> = defineApp();
app.use(betterAuth);
app.use(migrations);
app.use(workpool, { name: "directorySync" });

export default app;
