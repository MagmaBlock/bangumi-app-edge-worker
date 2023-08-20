const tagDict = {
  must: [
    "泡面里番",
    "3D里番",
    "里番",
    "R18|18+|18X|18禁",
    "鬼父",
    "缘之空",
    "无码",
    "有码",
    "人妻",
    "重口",
    "工口",
    "重口味",
    "H",
    "母系",
    "里番也放上来大丈夫？",
    "空之色水之色",
    " 艳母",
    "轮X",
    "柚子社",
    "美少女万华镜",
    "alicesoft",
    "ωstar",
    "InnocentGrey",
    "成年コミック",
    "肉块",
    "调教",
    "政治",
    "肛交",
    "内射",
    "口交",
    "拔作",
  ],
  perhaps: [
    "卖肉|肉番|肉",
    "巨乳",
    "纯爱",
    "人渣诚",
    "魔人",
    "BL",
    "伦理",
    "3D",
    "下限",
    "人渣",
    "兄妹",
    "兄控",
    "姐弟恋",
    "耽美",
    "非人类",
    "女教师",
    "R17",
    "R17漫改",
    "JK",
    "扶她",
    "galgame",
    "猎奇",
    "GAL",
    "NTR",
    "桐谷华",
    "伪娘",
    "血腥",
    "后宫",
    "网盘见",
    "乙女向",
    "GAL改",
    "内衣",
    "啪啪啪",
    "剧情",
  ],
};

/**
 * 判断此 subjectData 对应的条目为 NSFW 的可能性
 * @param {Object} subjectID
 * @returns {Object} name 标题, blocked 是否禁止, score 评分
 */
export async function isNSFW(subjectID) {
  let subjectData;

  try {
    subjectData = await fetch("https://api.bgm.tv/v0/subjects/" + subjectID, {
      headers: new Headers({
        "User-Agent": "magmablock/bangumi-app-image-proxy",
      }),
    });
    if (subjectData.ok) {
      subjectData = await subjectData.json(); // 继续下一步
      console.log(
        "成功抓取",
        subjectID,
        "的 Bangumi Subject API: ",
        subjectData
      );
    } else {
      console.error("请求", subjectID, "的 Bangumi Subject API 时出现意外:");
      throw subjectData;
    }
  } catch (error) {
    if (error.status == 404) {
      // 无法获取 API
      return {
        name: "(NSFW or 404)",
        blocked: true,
        score: -1,
        unknown: false,
      };
    } else {
      console.error(error);
      console.error("OSS 向服务端请求回源图片时, 拉取 BangumiAPI 失败！");
      throw "OSS 向服务端请求回源图片时, 拉取 BangumiAPI 失败！";
    }
  }

  // 条目评分
  let score = 0;

  // 用词典去找 tags 里的符合词
  for (let word of tagDict.must) {
    let reg = new RegExp("^" + word + "$", "i");
    for (let tag of subjectData.tags) {
      if (tag.count > 3 && reg.test(tag.name)) {
        score = score + 4;
        break;
      }
    }
  }
  for (let word of tagDict.perhaps) {
    let reg = new RegExp("^" + word + "$", "i");
    for (let tag of subjectData.tags) {
      if (tag.count > 3 && reg.test(tag.name)) {
        score = score + 1;
        break;
      }
    }
  }

  // 结果
  let nsfw = {
    name: subjectData.name_cn ?? subjectData.name,
    blocked: score >= 8 ? true : false,
    score: score, // 如果分数大于等于 8, 将会建议屏蔽
    // unknown: isUnknown(subjectData)
    unknown: false,
  };

  return nsfw;
}
