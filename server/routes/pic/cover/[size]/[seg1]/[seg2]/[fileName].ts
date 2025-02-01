import { isNSFW } from "~/functions/nsfw";

// 定义OpenAPI元数据
defineRouteMeta({
  openAPI: {
    summary: "获取条目封面图",
    description: "本方法用于 OSS 回源，和官方图片 URL 一致。",
    tags: ["镜像"],
    parameters: [
      {
        name: "size",
        description: "尺寸参数，目前仅支持l",
        in: "path",
        required: true,
        schema: { type: "string", example: "l" },
      },
      {
        name: "seg1",
        description: "路径分段1",
        in: "path",
        required: true,
        schema: { type: "string", example: "77" },
      },
      {
        name: "seg2",
        description: "路径分段2",
        in: "path",
        required: true,
        schema: { type: "string", example: "c3" },
      },
      {
        name: "fileName",
        description: "文件名（格式：条目ID_其他标识.jpg）",
        in: "path",
        required: true,
        schema: { type: "string", example: "454684_ZH5tU.jpg" },
      },
    ],
  },
});

export default defineEventHandler(async (event) => {
  // 获取路径参数
  const size = getRouterParam(event, "size");
  const seg1 = getRouterParam(event, "seg1");
  const seg2 = getRouterParam(event, "seg2");
  const fileName = getRouterParam(event, "fileName");

  // 从文件名提取bgmID
  const bgmIDMatch = fileName.match(/(\d{1,6})(?=_.*\.jpg$)/i);
  const bgmID = bgmIDMatch?.[0] || "";

  // NSFW检查
  const nsfw = await isNSFW(bgmID);
  if (nsfw.blocked || nsfw.unknown) {
    setResponseStatus(event, 404);
    return "过于冷门 / 拒绝回源";
  }

  // 构造原始图片URL
  const bgmCoverURL = new URL(
    `https://lain.bgm.tv/pic/cover/${size}/${seg1}/${seg2}/${fileName}`
  );

  // 代理请求
  return fetch(bgmCoverURL.toString());
});
