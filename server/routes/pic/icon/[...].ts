defineRouteMeta({
  openAPI: {
    summary: "获取 icon 图",
    description: "本方法用于 OSS 回源，和官方图片 URL 一致。",
    tags: ["镜像"],
    parameters: [
      {
        name: "*param1",
        in: "path",
        schema: {
          type: "string",
          description:
            "文档自带测试有 BUG，会将 / 转义，请自行在浏览器上测试。",
          example: "l/000/00/03/364.jpg",
        },
      },
    ],
  },
});

export default defineEventHandler((event) => {
  const path = getRequestURL(event);
  const bgmImgURL = new URL("https://lain.bgm.tv");
  bgmImgURL.pathname = path.pathname;
  return fetch(bgmImgURL);
});
