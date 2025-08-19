import { S3Client } from '@aws-sdk/client-s3';
import { getTempToken } from './dogecloud';

export async function createS3Client(options: {
  channel: 'VOD_UPLOAD' | 'OSS_UPLOAD' | 'OSS_FULL' | 'OSS_CUSTOM';
  scopes?: string[];
  allowActions?: string[];
  vodConfig?: Record<string, any>;
}) {
  // 获取临时凭证
  const tempToken = await getTempToken(options.channel, {
    scopes: options.scopes,
    allowActions: options.allowActions,
    vodConfig: options.vodConfig
  });

  // 从响应中提取凭证和端点信息
  const { accessKeyId, secretAccessKey, sessionToken } = tempToken.Credentials;
  const bucketInfo = tempToken.Buckets?.[0] || tempToken.VodUploadInfo;
  const s3Endpoint = bucketInfo?.s3Endpoint;
  const s3Bucket = bucketInfo?.s3Bucket;

  if (!s3Endpoint) {
    throw new Error('Failed to get S3 endpoint from DogeCloud response');
  }

  if (!s3Bucket) {
    throw new Error('Failed to get S3 bucket name from DogeCloud response');
  }

  // 创建 S3 客户端
  const s3Client = new S3Client({
    region: 'auto', // DogeCloud 使用自动区域
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken
    },
    forcePathStyle: true // DogeCloud 需要 path-style 访问
  });

  // 返回 S3 客户端和 s3Bucket 信息
  return {
    client: s3Client,
    s3Bucket: s3Bucket
  };
}