import Elysia, { t } from "elysia";
import { z } from "zod";
import { isNSFW } from "../functions/cover";

export const bgmMirror = new Elysia()
  // 头像图路由
  .get(
    "/pic/user/:userID/:fileName",
    /**
     * 本方法修改了官方了图片路由，官方的图片路径风格为 https://lain.bgm.tv/pic/user/c/000/59/90/599014.jpg?r=1671687974&hd=1
     * 在本代理中变为了 /pic/user/599014/1671687974.jpg
     */
    async ({ params: { userID, fileName } }) => {
      const ts = fileName.replace(/.jpg$/, "") || "0";

      // 格式化用户ID为6位补零格式
      const paddedID = userID.padStart(6, "0");
      const pathSegments = [paddedID.slice(0, 2), paddedID.slice(2, 4)];

      // 构造高清头像URL
      let url = new URL(
        `https://lain.bgm.tv/pic/user/c/000/${pathSegments[0]}/${pathSegments[1]}/${userID}.jpg`
      );
      url.searchParams.append("hd", "1");
      if (ts !== "0") url.searchParams.append("r", ts);

      // 尝试获取高清头像，失败时回退普通质量
      const img = await fetch(url);
      if (img.ok) return img;
      else {
        url.pathname = url.pathname.replace("/c/000/", "/l/000/");
        return fetch(url);
      }
    },
    {
      params: t.Object({
        userID: t.String({
          title: "用户 ID",
          description: "数字 ID",
        }),
        fileName: t.String({
          title: "文件名",
          description:
            '文件名为官方头像 URL 参数中的 "r" 参数拼接 ".jpg"。如官方 URL Query 为："?r=1671687974&hd=1"，则此处填 1671687974.jpg',
        }),
      }),
      detail: {
        summary: "获取用户头像",
        description: "本方法用于 OSS 回源",
      },
    }
  )
  // 封面图路由
  .get(
    "/pic/cover/:size/:seg1/:seg2/:fileName",
    async ({ params, set }) => {
      const bgmIDMatch = params.fileName.match(/(\d{0,6})(?=_.*\.jpg($|\?))/i);
      const bgmID = z.string().parse(bgmIDMatch?.[0]);

      const nsfw = await isNSFW(bgmID);
      if (nsfw.blocked || nsfw.unknown) {
        set.status = 404;
        return "过于冷门 / 拒绝回源";
      }

      const bgmCoverURL = new URL(
        `https://lain.bgm.tv/pic/cover/${params.size}/${params.seg1}/${params.seg2}/${params.fileName}`
      );
      return fetch(bgmCoverURL);
    },
    {
      detail: {
        summary: "获取条目封面图",
        description: "本方法用于 OSS 回源",
      },
      params: t.Object({
        size: t.String({
          title: "尺寸",
          description: "尺寸参数，目前仅支持 l",
          example: "l",
        }),
        seg1: t.String({
          example: "77",
        }),
        seg2: t.String({
          example: "c3",
        }),
        fileName: t.String({
          example: "454684_ZH5tU.jpg",
        }),
      }),
    }
  )
  // 角色/人物图路由
  .get("/pic/crt/*", ({ params }) => {
    const bgmImgURL = new URL(`https://lain.bgm.tv/pic/crt/${params["*"]}`);
    return fetch(bgmImgURL);
  })
  // icon 路由
  .get("/pic/icon/*", ({ params }) => {
    const bgmImgURL = new URL(`https://lain.bgm.tv/pic/icon/${params["*"]}`);
    return fetch(bgmImgURL);
  });
