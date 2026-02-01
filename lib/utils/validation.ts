import {
  VideoMakerOptions,
  ResolutionPreset,
  TransitionType,
  KenBurnsDirection,
  WatermarkPosition,
  TextPosition,
  TextAnimation,
  QualityPreset,
} from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FieldValidation {
  field: string;
  value: unknown;
  valid: boolean;
  message?: string;
}

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
];

const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/m4a',
];

const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const VALID_TRANSITIONS: TransitionType[] = [
  'none',
  'fade',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'dissolve',
  'zoom-in',
  'zoom-out',
  'wipe-left',
  'wipe-right',
  'wipe-up',
  'wipe-down',
  'rotate-clockwise',
  'rotate-counterclockwise',
];

const VALID_RESOLUTIONS: ResolutionPreset[] = [
  '480p',
  '720p',
  '1080p',
  'vertical-9-16',
  'square-1-1',
];

const VALID_QUALITIES: QualityPreset[] = [
  'low',
  'medium',
  'high',
  'ultra',
];

const VALID_KEN_BURNS_DIRECTIONS: KenBurnsDirection[] = [
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'pan-up',
  'pan-down',
];

export function validateOptions(options: Partial<VideoMakerOptions>): ValidationResult {
  const errors: string[] = [];

  if (!options.imagesSource) {
    errors.push('Images source is required (binary or url)');
  }

  if (options.imagesSource === 'url' && (!options.imageUrls || options.imageUrls.length === 0)) {
    errors.push('At least one image URL is required when source is url');
  }

  if (!options.audioSource) {
    errors.push('Audio source is required (binary or url)');
  }

  if (options.audioSource === 'url' && !options.audioUrl) {
    errors.push('Audio URL is required when source is url');
  }

  if (!options.outputFormat) {
    errors.push('Output format is required');
  }

  if (!options.resolution) {
    errors.push('Resolution is required');
  } else if (options.resolution !== 'custom' && !VALID_RESOLUTIONS.includes(options.resolution)) {
    errors.push(`Invalid resolution: ${options.resolution}. Valid options: ${VALID_RESOLUTIONS.join(', ')}`);
  }

  if (options.resolution === 'custom') {
    if (!options.customWidth || options.customWidth < 1) {
      errors.push('Custom width must be a positive number');
    }
    if (!options.customHeight || options.customHeight < 1) {
      errors.push('Custom height must be a positive number');
    }
  }

  if (!options.quality) {
    errors.push('Quality is required');
  } else if (!VALID_QUALITIES.includes(options.quality)) {
    errors.push(`Invalid quality: ${options.quality}. Valid options: ${VALID_QUALITIES.join(', ')}`);
  }

  if (!options.fps || options.fps < 1 || options.fps > 120) {
    errors.push('FPS must be between 1 and 120');
  }

  if (!options.durationMode) {
    errors.push('Duration mode is required');
  }

  if (options.durationMode === 'custom' && (!options.customDuration || options.customDuration < 0.1)) {
    errors.push('Custom duration must be at least 0.1 seconds');
  }

  if (!options.defaultImageDuration || options.defaultImageDuration < 0.1) {
    errors.push('Default image duration must be at least 0.1 seconds');
  }

  if (options.defaultTransition && !VALID_TRANSITIONS.includes(options.defaultTransition)) {
    errors.push(`Invalid transition: ${options.defaultTransition}. Valid options: ${VALID_TRANSITIONS.join(', ')}`);
  }

  if (options.transitionDuration !== undefined && options.transitionDuration < 0) {
    errors.push('Transition duration cannot be negative');
  }

  if (options.transitionDuration !== undefined && options.transitionDuration > options.defaultImageDuration) {
    errors.push('Transition duration cannot be longer than image duration');
  }

  if (options.kenBurnsEnabled) {
    if (!options.kenBurnsZoom || options.kenBurnsZoom < 1 || options.kenBurnsZoom > 3) {
      errors.push('Ken Burns zoom must be between 1 and 3');
    }

    if (options.kenBurnsDirection && !VALID_KEN_BURNS_DIRECTIONS.includes(options.kenBurnsDirection)) {
      errors.push(`Invalid Ken Burns direction: ${options.kenBurnsDirection}`);
    }
  }

  if (options.watermarkEnabled) {
    if (!options.watermarkSource) {
      errors.push('Watermark source is required when watermark is enabled');
    }

    if (options.watermarkOpacity < 0 || options.watermarkOpacity > 1) {
      errors.push('Watermark opacity must be between 0 and 1');
    }

    if (options.watermarkScale < 1 || options.watermarkScale > 100) {
      errors.push('Watermark scale must be between 1 and 100');
    }
  }

  if (options.textOverlayEnabled) {
    if (!options.textContent && (!options.textPerImage || options.textPerImage.length === 0)) {
      errors.push('Text content is required when text overlay is enabled');
    }

    if (options.fontSize < 8 || options.fontSize > 200) {
      errors.push('Font size must be between 8 and 200');
    }
  }

  if (options.retryCount !== undefined && (options.retryCount < 0 || options.retryCount > 10)) {
    errors.push('Retry count must be between 0 and 10');
  }

  if (options.retryDelay !== undefined && options.retryDelay < 0) {
    errors.push('Retry delay cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateImageUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL must be a non-empty string');
    return { valid: false, errors };
  }

  try {
    new URL(url);
  } catch {
    errors.push('Invalid URL format');
  }

  const validProtocols = ['http:', 'https:'];
  try {
    const urlObj = new URL(url);
    if (!validProtocols.includes(urlObj.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }
  } catch {
  }

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
  const extension = '.' + url.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`URL must point to an image file. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAudioUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL must be a non-empty string');
    return { valid: false, errors };
  }

  try {
    new URL(url);
  } catch {
    errors.push('Invalid URL format');
  }

  const allowedExtensions = ['.mp3', '.wav', '.aac', '.ogg', '.m4a'];
  const extension = '.' + url.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`URL must point to an audio file. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateBinaryData(
  binaryData: { mimeType?: string; data?: Buffer },
  allowedMimeTypes: string[]
): ValidationResult {
  const errors: string[] = [];

  if (!binaryData) {
    errors.push('Binary data is required');
    return { valid: false, errors };
  }

  if (!binaryData.mimeType) {
    errors.push('MIME type is required');
  } else if (!allowedMimeTypes.includes(binaryData.mimeType)) {
    errors.push(`Invalid MIME type: ${binaryData.mimeType}. Allowed types: ${allowedMimeTypes.join(', ')}`);
  }

  if (!binaryData.data || binaryData.data.length === 0) {
    errors.push('Binary data cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateImageBinary(binaryData: { mimeType?: string; data?: Buffer }): ValidationResult {
  return validateBinaryData(binaryData, ALLOWED_IMAGE_MIME_TYPES);
}

export function validateAudioBinary(binaryData: { mimeType?: string; data?: Buffer }): ValidationResult {
  return validateBinaryData(binaryData, ALLOWED_AUDIO_MIME_TYPES);
}

export function validateResolution(width: number, height: number): ValidationResult {
  const errors: string[] = [];

  if (width < 1 || width > 7680) {
    errors.push('Width must be between 1 and 7680 (8K)');
  }

  if (height < 1 || height > 4320) {
    errors.push('Height must be between 1 and 4320 (8K)');
  }

  const aspectRatio = width / height;
  if (aspectRatio < 0.1 || aspectRatio > 10) {
    errors.push('Unusual aspect ratio detected. Please verify dimensions are correct.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateFilePath(filePath: string): ValidationResult {
  const errors: string[] = [];

  if (!filePath || typeof filePath !== 'string') {
    errors.push('File path must be a non-empty string');
    return { valid: false, errors };
  }

  if (filePath.includes('..') || filePath.includes('~')) {
    errors.push('File path contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeText(text: string): string {
  return text
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function parseJsonSafe<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
