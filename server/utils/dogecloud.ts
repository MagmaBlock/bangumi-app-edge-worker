import { createHmac } from 'node:crypto';

export async function dogecloudApi(
  apiPath: string,
  data: Record<string, any> = {},
  jsonMode = false,
) {
  const { dogeAccessKey, dogeSecretKey } = useRuntimeConfig();

  if (!dogeAccessKey || !dogeSecretKey) {
    throw new Error('DOGE_ACCESS_KEY and DOGE_SECRET_KEY must be set in runtime config');
  }

  const body = jsonMode ? JSON.stringify(data) : new URLSearchParams(data).toString();
  const sign = createHmac('sha1', dogeSecretKey)
    .update(Buffer.from(`${apiPath}\n${body}`, 'utf8'))
    .digest('hex');
  const authorization = `TOKEN ${dogeAccessKey}:${sign}`;

  const response = await fetch(`https://api.dogecloud.com${apiPath}`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': jsonMode
        ? 'application/json'
        : 'application/x-www-form-urlencoded',
      'Authorization': authorization,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.code !== 200) {
    throw new Error(`API Error: ${result.msg}`);
  }

  return result.data;
}

export function getTempToken(
  channel: 'VOD_UPLOAD' | 'OSS_UPLOAD' | 'OSS_FULL' | 'OSS_CUSTOM',
  options: {
    ttl?: number;
    vodConfig?: Record<string, any>;
    scopes?: string[];
    allowActions?: string[];
  } = {},
) {
  const data = { channel, ...options };
  return dogecloudApi('/auth/tmp_token.json', data, true);
}