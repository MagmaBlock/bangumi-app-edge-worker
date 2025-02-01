import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { bgmMirror } from "./router/bgm-mirror";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: { title: "bangumi-app-edge-worker", version: "1.0.0" },
      },
    })
  )
  .use(bgmMirror)
  // 404 处理
  .all("*", ({ set }) => {
    set.status = 404;
    return "未知的请求";
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export default app;
