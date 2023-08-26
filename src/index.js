import { isNSFW } from "./functions/cover.js";

export default {
  async fetch(request, env) {
    try {
      const { pathname } = new URL(request.url);

      // 头像图，匹配 /pic/user/数字/数字.jpg
      if (pathname.match(/^\/pic\/user\/\d*\/\d*\.jpg$/i)) {
        const userID = pathname.split("/")[3];
        const pathID = userID.padStart(6, "0");
        const pathID1 = pathID.charAt(0) + pathID.charAt(1);
        const pathID2 = pathID.charAt(2) + pathID.charAt(3);

        const fileName = pathname.split("/")[4];
        const ts = fileName.replace(".jpg", "");

        let url = new URL(
          `https://lain.bgm.tv/pic/user/c/000/${pathID1}/${pathID2}/${userID}.jpg`
        );
        url.searchParams.append("hd", "1");
        if (ts != "0") url.searchParams.append("r", ts);
        console.log(url);
        let img = await fetch(url);
        if (img.ok) {
          return img;
        } else {
          url.pathname = `/pic/user/l/000/${pathID1}/${pathID2}/${userID}.jpg`;
          console.log(url);
          return fetch(url);
        }
      }
      // 未设置头像图的用户
      if (pathname.match(/^\/pic\/user\/l\/icon\.jpg$/i)) {
        return fetch("https://lain.bgm.tv/pic/user/l/icon.jpg");
      }

      // 封面图
      if (pathname.match(/^\/pic\/cover\/l\/\w*\/\w*\/\d*_.*\.jpg$/i)) {
        // 提取 Bangumi ID
        let bgmID = pathname.split("/");
        bgmID = bgmID[bgmID.length - 1];
        bgmID = bgmID.replace(/_.*\.jpg$/i, "");

        // 判断 NSFW
        let nsfw = await isNSFW(bgmID);
        console.log(bgmID, "的 NSFW 结果:", nsfw);

        // nsfw 指数较高(>=8)或不知名条目将不再回源
        if (nsfw.blocked || nsfw.unknown) {
          console.log(
            "拒绝回源",
            `[${nsfw.score}]${nsfw.blocked ? "(NSFW?)" : ""}${nsfw.unknown ? "过于冷门" : ""
            }`
          );
          return new Response("过于冷门 / 拒绝回源", { status: 404 });
        }

        let bgmCoverURL = new URL("https://lain.bgm.tv/");
        bgmCoverURL.pathname = pathname;
        return fetch(bgmCoverURL);
      }

      // 角色/人物图
      if (pathname.match(/^\/pic\/crt\/.*\.jpg$/i)) {
        let bgmImgURL = new URL("https://lain.bgm.tv/");
        bgmImgURL.pathname = pathname;
        return fetch(bgmImgURL);
      }

      // icon
      if (pathname.match(/^\/pic\/icon\/.*\.jpg$/i)) {
        let bgmImgURL = new URL("https://lain.bgm.tv/");
        bgmImgURL.pathname = pathname;
        return fetch(bgmImgURL);
      }
      return new Response("未知的请求.", { status: 404 });
    } catch (error) {
      return new Response(error.stack, { status: 500 });
    }
  },
};
