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
    summary: "使用免费模型 completions",
    tags: ["AI"],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              messages: {
                type: "array",
              },
              temperature: {
                type: "number",
                default: 1.2,
              },
            },
            required: ["messages"],
          },
        },
      },
    },
  },
});

export default defineEventHandler(async (event) => {
  // 读取请求体
  const body = await readBody(event);
  const { messages, temperature } = z
    .object({
      messages: z.array(z.any()),
      temperature: z.number().default(1.2),
    })
    .parse(body);

  try {
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages,
      stream: false,
      temperature,
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
