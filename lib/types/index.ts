import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  IBinaryData,
} from 'n8n-workflow';

export interface VideoMakerOptions {
  imagesSource: 'binary' | 'url';
  imagesBinaryProperty: string;
  imageUrls: string[];
  audioSource: 'binary' | 'url';
  audioBinaryProperty: string;
  audioUrl: string;
  outputFormat: 'mp4-h264' | 'mp4-h265' | 'webm';
  resolution: ResolutionPreset | 'custom';
  customWidth?: number;
  customHeight?: number;
  quality: QualityPreset;
  fps: number;
  durationMode: 'match-audio' | 'per-image-total' | 'custom';
  customDuration?: number;
  defaultImageDuration: number;
  defaultTransition: TransitionType;
  transitionDuration: number;
  kenBurnsEnabled: boolean;
  kenBurnsZoom: number;
  kenBurnsDirection: KenBurnsDirection;
  watermarkEnabled: boolean;
  watermarkSource: 'binary' | 'url';
  watermarkBinaryProperty: string;
  watermarkUrl: string;
  watermarkPosition: WatermarkPosition;
  watermarkX?: number;
  watermarkY?: number;
  watermarkOpacity: number;
  watermarkScale: number;
  watermarkMargin: number;
  textOverlayEnabled: boolean;
  textContent: string;
  textPerImage?: TextPerImage[];
  fontName: string;
  fontSize: number;
  fontColor: string;
  fontPath?: string;
  textPosition: TextPosition;
  textX?: number;
  textY?: number;
  textAnimation: TextAnimation;
  animationDuration: number;
  imageOverrides?: ImageOverride[];
  retryCount: number;
  retryDelay: number;
  logLevel: 'none' | 'basic' | 'detailed';
  cleanupTempFiles: boolean;
}

export type ResolutionPreset = '1080p' | '720p' | '480p' | 'vertical-9-16' | 'square-1-1';

export interface Resolution {
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: Record<ResolutionPreset, Resolution> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  'vertical-9-16': { width: 1080, height: 1920 },
  'square-1-1': { width: 1080, height: 1080 },
};

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export const QUALITY_PRESETS: Record<QualityPreset, { videoBitrate: string; audioBitrate: string; crf: number }> = {
  low: { videoBitrate: '2M', audioBitrate: '128k', crf: 28 },
  medium: { videoBitrate: '5M', audioBitrate: '192k', crf: 23 },
  high: { videoBitrate: '10M', audioBitrate: '256k', crf: 18 },
  ultra: { videoBitrate: '20M', audioBitrate: '320k', crf: 15 },
};

export type TransitionType =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'dissolve'
  | 'zoom-in'
  | 'zoom-out'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'rotate-clockwise'
  | 'rotate-counterclockwise';

export type KenBurnsDirection =
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down';

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type TextPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type TextAnimation = 'none' | 'fade-in' | 'fade-out' | 'slide-in' | 'typewriter';

export interface TextPerImage {
  index: number;
  text: string;
}

export interface ImageOverride {
  index: number;
  duration?: number;
  transition?: TransitionType;
  transitionDuration?: number;
  kenBurnsEnabled?: boolean;
  kenBurnsZoom?: number;
  kenBurnsDirection?: KenBurnsDirection;
  text?: string;
}

export interface ProcessedImage {
  path: string;
  width: number;
  height: number;
  duration: number;
  transition?: TransitionType;
  transitionDuration?: number;
  kenBurnsEnabled?: boolean;
  kenBurnsZoom?: number;
  kenBurnsDirection?: KenBurnsDirection;
  text?: string;
  order: number;
}

export interface ProcessedAudio {
  path: string;
  duration: number;
}

export interface FFmpegProgress {
  percent: number;
  currentTime: string;
  totalTime: string;
  fps: number;
  bitrate: string;
  speed: string;
}

export interface FFmpegResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  progress?: FFmpegProgress;
}

export type ProgressCallback = (progress: FFmpegProgress) => void;
export type LogCallback = (level: string, message: string) => void;

export interface NodeExecutionContext {
  executeFunctions: IExecuteFunctions;
  itemIndex: number;
  nodeHelpers: {
    prepareOutputData: (outputData: INodeExecutionData[]) => Promise<INodeExecutionData[]>;
    getBinaryData: (propertyName: string) => Promise<IBinaryData | undefined>;
    downloadImage: (url: string) => Promise<string>;
    downloadAudio: (url: string) => Promise<string>;
    cleanupTempFiles: (paths: string[]) => void;
  };
}
