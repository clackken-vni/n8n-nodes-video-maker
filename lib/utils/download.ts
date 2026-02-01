import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  contentType?: string;
  fileSize?: number;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/ogg'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.aac', '.ogg', '.m4a'];

export async function downloadFile(
  url: string,
  options?: {
    timeout?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
    tempDir?: string;
  }
): Promise<DownloadResult> {
  const timeout = options?.timeout || 30000;
  const allowedTypes = options?.allowedTypes || [];
  const allowedExtensions = options?.allowedExtensions || [];
  const tempDir = options?.tempDir || process.env.TMPDIR || '/tmp';

  try {
    const response: AxiosResponse = await axios({
      method: 'GET',
      url,
      timeout,
      responseType: 'arraybuffer',
    });

    const contentType = response.headers['content-type'];
    const contentLength = response.headers['content-length'];

    if (allowedTypes.length > 0 && !allowedTypes.includes(contentType)) {
      return { success: false, error: `Invalid content type: ${contentType}` };
    }

    const urlObj = new URL(url);
    const originalFilename = path.basename(urlObj.pathname);
    const extension = path.extname(originalFilename).toLowerCase();

    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
      return { success: false, error: `Invalid file extension: ${extension}` };
    }

    const fileName = `download_${Date.now()}${extension || '.tmp'}`;
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(response.data));

    return {
      success: true,
      filePath,
      contentType,
      fileSize: parseInt(contentLength?.toString() || '0', 10),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Download failed' };
  }
}

export async function downloadImage(url: string, tempDir?: string): Promise<DownloadResult> {
  return downloadFile(url, { allowedTypes: ALLOWED_IMAGE_TYPES, allowedExtensions: ALLOWED_IMAGE_EXTENSIONS, tempDir });
}

export async function downloadAudio(url: string, tempDir?: string): Promise<DownloadResult> {
  return downloadFile(url, { allowedTypes: ALLOWED_AUDIO_TYPES, allowedExtensions: ALLOWED_AUDIO_EXTENSIONS, tempDir });
}

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractUrlsFromText(text: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlPattern);
  return matches || [];
}

export function parseImageUrls(input: string): string[] {
  const urls: string[] = [];

  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (typeof item === 'string') urls.push(item);
        else if (typeof item === 'object' && item.url) urls.push(item.url);
      });
    }
  } catch {
    urls.push(...extractUrlsFromText(input));
  }

  return urls.filter((url) => isValidUrl(url));
}
