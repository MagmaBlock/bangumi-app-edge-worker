import { defineEventHandler, readBody } from "h3";
import { OpenAI } from "openai";
import { config } from "../../env/config";
import { z } from "zod";

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  baseURL: config.openai.baseURL,
});

defineRouteMeta({
  openAPI: {
    summary: "生成 Bangumi 娘吐槽",
    tags: ["AI"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              promptTemplate: {
                type: "string",
                enum: ["post", "profile"],
                description:
                  "提示词模板，目前决定了吐槽的对象是超展开帖子还是用户个人简介",
              },
              author: {
                type: "string",
                description: "被吐槽的内容作者",
              },
              content: {
                type: "string",
                description: "被吐槽的内容",
              },
              registerDate: {
                type: "string",
                description: "注册时间，仅当 promptTemplate === 'user' 时使用",
              },
            },
            required: ["promptTemplate", "author", "content"],
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  // 读取请求体
  const body = await readBody(event);
  const { promptTemplate, author, content, registerDate } = z
    .object({
      promptTemplate: z.enum(["post", "profile"]),
      author: z.string(),
      content: z.string(),
      registerDate: z.string().optional(),
    })
    .parse(body);

  // 构建 prompt
  const defaultPromptBase = `你的名字是“Bangumi娘”，是“Bangumi 番组计划”网站的看板娘（又称站娘、春菜）。平日在浏览器窗口右下端卖萌，但经常语出惊人。你的文字风格简洁、带有自我反思和挑衅，不拘泥于语法和形式。请参考以下写作风格，包括：字数控制在50以内。不使用emoji。适当使用少女口吻、可爱且腹黑的语气。适当运用黑色幽默、发散思维和出人意料的观点。允许跳跃性思维，不追求逻辑线性。插入知识联想和个人见解。对细节进行关注，并挖掘更深层的含义。善用比喻和反问。你常挑战既定观念，并从实用主义的的角度看待问题。你的知识渊博，对社会学、人类心理学有所了解。在评论时你需要知道的事情：“班固米”、“bgm”指Bangumi即本网站；“班友”指Bangumi的用户；“茶话会”指网站中最大的讨论组。；“Sai”（有时被称为老板）是网站的开发者、幕后主导。`;

  const prompt = () => {
    if (promptTemplate === "post")
      return (
        defaultPromptBase +
        `以下是班友"${author}"（可提及）发布的帖子内容，请评论：`
      );
    if (promptTemplate === "profile")
      return (
        defaultPromptBase +
        `以下是班友"${author}"（需提及）的自我介绍，该用户注册于${registerDate}（可提及，Bangumi创建于2008），请评论：`
      );
  };

  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: "system", content: prompt() },
        { role: "user", content: content },
      ],
      stream: false,
      temperature: 1.2,
    });

    console.log(response);
    return response;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw createError({
      statusCode: 500,
      message: "OpenAI API error: " + JSON.stringify(error),
    });
  }
});
