import { Redis } from "@upstash/redis";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { handle } from "hono/vercel";

// deploying to vercel
export const runtime = "edge";

type EnvConfig = {
  REDIS_URL: string;
  REDIS_TOKEN: string;
};

const app = new Hono().basePath("/api");

app.get("/search", async (c) => {
  try {
    const { REDIS_URL, REDIS_TOKEN } = env<EnvConfig>(c);
    console.log(REDIS_URL, REDIS_TOKEN);
    //------------------------------
    const start = performance.now();

    const redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });

    const query = c.req.query("q")?.toUpperCase();

    if (!query) {
      return c.json({ error: "Query is required" }, { status: 400 });
    }

    const res = [];
    const rank = await redis.zrank("terms", query);

    if (rank !== null && rank !== undefined) {
      const keys = await redis.zrange<string[]>("terms", rank, rank + 100);

      for (const key of keys) {
        if (!key.startsWith(query)) {
          break;
        }

        if (key.endsWith("*")) {
          res.push(key.slice(0, -1));
        }
      }
    }

    //------------------------------
    const end = performance.now();

    return c.json({
      results: res,
      message: "Success",
      duration: end - start,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      { results: [], message: "Something went wrong", duration: 0 },
      { status: 500 }
    );
  }
});

// deploying to vercel
export const GET = handle(app);
// deploying to cloudflare workers
export default app as never;
