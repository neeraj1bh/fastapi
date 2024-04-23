import { Hono } from "hono";
import { handle } from "hono/vercel";

// deploying to vercel
export const runtime = "edge";

const app = new Hono().basePath("/api");

app.get("/search", (c) => {
  return c.json({});
});

// deploying to vercel
export const GET = handle(app);
// deploying to cloudflare workers
export default app as never;
