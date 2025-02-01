defineRouteMeta({
  openAPI: {
    summary: "获取用户头像",
    description:
      "本方法用于 OSS 回源。<br>本方法修改了官方了图片路由，官方的图片路径风格为 https://lain.bgm.tv/pic/user/c/000/59/90/599014.jpg?r=1671687974&hd=1 <br>在本代理中变为了 /pic/user/599014/1671687974.jpg",
    tags: ["镜像"],
    parameters: [
      {
        name: "userID",
        summary: "用户 ID",
        description: "数字 ID",
        in: "path",
      },
      {
        name: "fileName",
        summary: "文件名",
        description:
          '文件名为官方头像 URL 参数中的 "r" 参数拼接 ".jpg"。<br>如官方 URL Query 为："?r=1671687974&hd=1"，则此处填 1671687974.jpg',
        in: "path",
      },
    ],
  },
});

export default defineEventHandler(async (event) => {
  const userID = getRouterParam(event, "userID");
  const fileName = getRouterParam(event, "fileName");

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
});
