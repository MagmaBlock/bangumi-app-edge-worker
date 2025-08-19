import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createS3Client } from "../../utils/s3-client";

// 定义OpenAPI元数据
defineRouteMeta({
  openAPI: {
    summary: "列出S3桶中的文件",
    description:
      "列出DogeCloud账户下指定桶和目录前缀的文件列表，只允许列出 pic/user/ 目录下的文件",
    tags: ["S3"],
    parameters: [
      {
        name: "prefix",
        description: "要列出文件的目录前缀，只允许列出 pic/user/ 目录下的文件",
        in: "query",
        required: false,
        schema: { type: "string", example: "pic/user/" },
      },
      {
        name: "maxKeys",
        description: "返回的最大文件数量，范围1-1000",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 1000,
          default: 1000,
          example: 100,
        },
      },
    ],
    responses: {
      "200": {
        description: "成功返回文件列表",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                bucket: { type: "string", example: "lavaanime" },
                prefix: { type: "string", example: "images/" },
                files: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      key: { type: "string", example: "images/photo.jpg" },
                      lastModified: {
                        type: "string",
                        format: "date-time",
                        example: "2023-01-01T00:00:00.000Z",
                      },
                      size: { type: "integer", example: 1024 },
                      eTag: { type: "string", example: "abc123" },
                    },
                  },
                },
                directories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      prefix: { type: "string", example: "images/thumbnails/" },
                    },
                  },
                },
                isTruncated: { type: "boolean", example: false },
                nextContinuationToken: {
                  type: "string",
                  nullable: true,
                  example: null,
                },
              },
            },
          },
        },
      },
      "400": {
        description: "请求参数错误",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: { type: "string" },
                statusCode: { type: "integer", example: 400 },
                statusMessage: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      "403": {
        description: "访问被拒绝",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: { type: "string" },
                statusCode: { type: "integer", example: 403 },
                statusMessage: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      "404": {
        description: "桶不存在",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: { type: "string" },
                statusCode: { type: "integer", example: 404 },
                statusMessage: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
      "500": {
        description: "服务器内部错误",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                url: { type: "string" },
                statusCode: { type: "integer", example: 500 },
                statusMessage: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
});

export default eventHandler(async (event) => {
  try {
    // 获取查询参数
    const { prefix = "", maxKeys = "1000" } = getQuery(event);

    // 验证 maxKeys 参数
    const maxKeysNum = parseInt(maxKeys as string, 10);
    if (isNaN(maxKeysNum) || maxKeysNum < 1 || maxKeysNum > 1000) {
      throw createError({
        statusCode: 400,
        message:
          "Invalid maxKeys parameter. Must be a number between 1 and 1000.",
      });
    }

    // 处理 prefix 参数，确保只列出 pic/user/ 目录下的文件
    let prefixStr = prefix as string;
    if (!prefixStr) {
      // 如果 prefix 为空，则默认设置为 pic/user/
      prefixStr = "pic/user/";
    } else if (!prefixStr.startsWith("pic/user/")) {
      // 如果 prefix 不为空但不以 pic/user/ 开头，则拒绝访问
      throw createError({
        statusCode: 403,
        message:
          "Access denied. Only files under pic/user/ directory can be listed.",
      });
    }

    // 从环境变量获取存储桶名称
    const bucketName = useRuntimeConfig().dogeBucketName;

    // 验证存储桶名称
    if (!bucketName) {
      throw createError({
        statusCode: 400,
        message: "Missing DOGE_BUCKET_NAME in runtime config",
      });
    }

    // 创建 S3 客户端 (使用 OSS_CUSTOM 权限，只读操作)
    const { client: s3Client, s3Bucket } = await createS3Client({
      channel: "OSS_CUSTOM",
      // scopes 不能为空，指定允许访问的存储桶和路径
      scopes: [`${bucketName}:*`], // 允许访问指定存储桶的所有文件
      // 指定允许的操作权限
      allowActions: ["GetBucket", "GetObject"], // 只读权限
    });

    // 构造列出对象的命令
    // 使用 DogeCloud API 返回的 s3Bucket 名称
    const command = new ListObjectsV2Command({
      Bucket: s3Bucket,
      Prefix: prefixStr,
      MaxKeys: maxKeysNum,
    });

    // 执行命令并获取结果
    const response = await s3Client.send(command);

    // 处理响应数据
    const files = (response.Contents || []).map((item) => ({
      key: item.Key,
      lastModified: item.LastModified?.toISOString(),
      size: item.Size,
      eTag: item.ETag?.replace(/"/g, ""), // 移除 ETag 前后的引号
    }));

    // 处理目录信息
    const directories = (response.CommonPrefixes || []).map((prefix) => ({
      prefix: prefix.Prefix,
    }));

    // 返回文件和目录列表
    return {
      success: true,
      bucket: bucketName, // 返回逻辑存储桶名称
      prefix: prefixStr,
      files,
      directories,
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
    };
  } catch (error: any) {
    console.error("Error listing S3 objects:", error);

    // 根据错误类型返回适当的错误信息
    if (error.name === "NoSuchBucket") {
      throw createError({
        statusCode: 404,
        message: `Bucket not found`,
      });
    } else if (error.name === "AccessDenied") {
      throw createError({
        statusCode: 403,
        message: "Access denied to the specified bucket or prefix",
      });
    } else {
      throw createError({
        statusCode: 500,
        message: error.message || "Failed to list objects",
      });
    }
  }
});
