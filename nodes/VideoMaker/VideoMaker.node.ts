import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  INodeProperties,
} from 'n8n-workflow';

interface VideoMakerOptions {
  imagesSource: 'binary' | 'url';
  imagesBinaryProperty: string;
  imageUrls: string[];
  audioSource: 'binary' | 'url' | 'none';
  audioBinaryProperty: string;
  audioUrl: string;
  outputFormat: 'mp4-h264' | 'mp4-h265' | 'webm';
  resolution: '1080p' | '720p' | 'vertical-9-16' | 'custom';
  customWidth: number;
  customHeight: number;
  quality: 'low' | 'medium' | 'high';
  fps: number;
  defaultImageDuration: number;
  defaultTransition: 'none' | 'fade' | 'dissolve';
  transitionDuration: number;
  kenBurnsEnabled: boolean;
  kenBurnsZoom: number;
  watermarkEnabled: boolean;
  watermarkUrl: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkOpacity: number;
  watermarkScale: number;
  watermarkMargin: number;
  textOverlayEnabled: boolean;
  textContent: string;
  fontSize: number;
  fontColor: string;
  textPosition: 'top-center' | 'bottom-center';
  logLevel: 'none' | 'basic';
  cleanupTempFiles: boolean;
}

const RESOLUTION_PRESETS: Record<string, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  'vertical-9-16': { width: 1080, height: 1920 },
};

const QUALITY_PRESETS: Record<string, { videoBitrate: string; crf: number }> = {
  'low': { videoBitrate: '2M', crf: 28 },
  'medium': { videoBitrate: '5M', crf: 23 },
  'high': { videoBitrate: '10M', crf: 18 },
};

export class VideoMaker implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Video Maker',
    name: 'videoMaker',
    icon: 'file:videomaker.svg',
    group: ['transform'],
    version: 1,
    description: 'Creates video slideshows from images and audio using FFmpeg',
    defaults: { name: 'Video Maker' },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [],
    properties: [
      { displayName: 'Images Source', name: 'imagesSource', type: 'options', options: [{ name: 'Binary Data', value: 'binary' }, { name: 'URLs', value: 'url' }], default: 'binary' },
      { displayName: 'Binary Property', name: 'imagesBinaryProperty', type: 'string', default: 'data', displayOptions: { show: { imagesSource: ['binary'] } } },
      { displayName: 'Image URLs', name: 'imageUrls', type: 'string', typeOptions: { rows: 5 }, default: '', displayOptions: { show: { imagesSource: ['url'] } } },
      { displayName: 'Audio Source', name: 'audioSource', type: 'options', options: [{ name: 'Binary Data', value: 'binary' }, { name: 'URL', value: 'url' }, { name: 'None', value: 'none' }], default: 'url' },
      { displayName: 'Audio Binary Property', name: 'audioBinaryProperty', type: 'string', default: 'data', displayOptions: { show: { audioSource: ['binary'] } } },
      { displayName: 'Audio URL', name: 'audioUrl', type: 'string', default: '', displayOptions: { show: { audioSource: ['url'] } } },
      { displayName: 'Output Format', name: 'outputFormat', type: 'options', options: [{ name: 'MP4 (H.264)', value: 'mp4-h264' }, { name: 'MP4 (H.265)', value: 'mp4-h265' }, { name: 'WebM', value: 'webm' }], default: 'mp4-h264' },
      { displayName: 'Resolution', name: 'resolution', type: 'options', options: [{ name: '1080p', value: '1080p' }, { name: '720p', value: '720p' }, { name: 'Vertical 9:16', value: 'vertical-9-16' }, { name: 'Custom', value: 'custom' }], default: '1080p' },
      { displayName: 'Custom Width', name: 'customWidth', type: 'number', default: 1920, displayOptions: { show: { resolution: ['custom'] } } },
      { displayName: 'Custom Height', name: 'customHeight', type: 'number', default: 1080, displayOptions: { show: { resolution: ['custom'] } } },
      { displayName: 'Quality', name: 'quality', type: 'options', options: [{ name: 'Low', value: 'low' }, { name: 'Medium', value: 'medium' }, { name: 'High', value: 'high' }], default: 'medium' },
      { displayName: 'FPS', name: 'fps', type: 'number', default: 30, typeOptions: { min: 1, max: 60 } },
      { displayName: 'Default Image Duration (s)', name: 'defaultImageDuration', type: 'number', default: 3, typeOptions: { min: 0.1, step: 0.1 } },
      { displayName: 'Default Transition', name: 'defaultTransition', type: 'options', options: [{ name: 'None', value: 'none' }, { name: 'Fade', value: 'fade' }, { name: 'Dissolve', value: 'dissolve' }], default: 'fade' },
      { displayName: 'Transition Duration (s)', name: 'transitionDuration', type: 'number', default: 0.5, typeOptions: { min: 0.1, step: 0.1 } },
      { displayName: 'Enable Ken Burns', name: 'kenBurnsEnabled', type: 'boolean', default: false },
      { displayName: 'Ken Burns Zoom', name: 'kenBurnsZoom', type: 'number', default: 1.2, typeOptions: { min: 1.0, max: 2.0, step: 0.1 }, displayOptions: { show: { kenBurnsEnabled: [true] } } },
      { displayName: 'Enable Watermark', name: 'watermarkEnabled', type: 'boolean', default: false },
      { displayName: 'Watermark URL', name: 'watermarkUrl', type: 'string', default: '', displayOptions: { show: { watermarkEnabled: [true] } } },
      { displayName: 'Watermark Position', name: 'watermarkPosition', type: 'options', options: [{ name: 'Top Left', value: 'top-left' }, { name: 'Top Right', value: 'top-right' }, { name: 'Bottom Left', value: 'bottom-left' }, { name: 'Bottom Right', value: 'bottom-right' }], default: 'bottom-right', displayOptions: { show: { watermarkEnabled: [true] } } },
      { displayName: 'Watermark Opacity', name: 'watermarkOpacity', type: 'number', default: 0.8, typeOptions: { min: 0.1, max: 1.0, step: 0.1 }, displayOptions: { show: { watermarkEnabled: [true] } } },
      { displayName: 'Watermark Scale (%)', name: 'watermarkScale', type: 'number', default: 20, displayOptions: { show: { watermarkEnabled: [true] } } },
      { displayName: 'Watermark Margin', name: 'watermarkMargin', type: 'number', default: 10, displayOptions: { show: { watermarkEnabled: [true] } } },
      { displayName: 'Enable Text Overlay', name: 'textOverlayEnabled', type: 'boolean', default: false },
      { displayName: 'Text Content', name: 'textContent', type: 'string', default: '', displayOptions: { show: { textOverlayEnabled: [true] } } },
      { displayName: 'Font Size', name: 'fontSize', type: 'number', default: 48, displayOptions: { show: { textOverlayEnabled: [true] } } },
      { displayName: 'Font Color', name: 'fontColor', type: 'color', default: '#FFFFFF', displayOptions: { show: { textOverlayEnabled: [true] } } },
      { displayName: 'Text Position', name: 'textPosition', type: 'options', options: [{ name: 'Top Center', value: 'top-center' }, { name: 'Bottom Center', value: 'bottom-center' }], default: 'bottom-center', displayOptions: { show: { textOverlayEnabled: [true] } } },
      { displayName: 'Log Level', name: 'logLevel', type: 'options', options: [{ name: 'None', value: 'none' }, { name: 'Basic', value: 'basic' }], default: 'basic' },
      { displayName: 'Cleanup Temp Files', name: 'cleanupTempFiles', type: 'boolean', default: true },
    ] as INodeProperties[],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const result: INodeExecutionData[][] = [[]];
    const fs = require('fs');
    const path = require('path');
    const axios = require('axios');
    const { exec } = require('child_process');

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const options: VideoMakerOptions = {
          imagesSource: this.getNodeParameter('imagesSource', itemIndex) as 'binary' | 'url',
          imagesBinaryProperty: this.getNodeParameter('imagesBinaryProperty', itemIndex) as string,
          imageUrls: parseUrls((this.getNodeParameter('imageUrls', itemIndex) as string) || ''),
          audioSource: this.getNodeParameter('audioSource', itemIndex) as 'binary' | 'url' | 'none',
          audioBinaryProperty: this.getNodeParameter('audioBinaryProperty', itemIndex) as string,
          audioUrl: this.getNodeParameter('audioUrl', itemIndex) as string,
          outputFormat: this.getNodeParameter('outputFormat', itemIndex) as 'mp4-h264' | 'mp4-h265' | 'webm',
          resolution: this.getNodeParameter('resolution', itemIndex) as '1080p' | '720p' | 'vertical-9-16' | 'custom',
          customWidth: this.getNodeParameter('customWidth', itemIndex) as number,
          customHeight: this.getNodeParameter('customHeight', itemIndex) as number,
          quality: this.getNodeParameter('quality', itemIndex) as 'low' | 'medium' | 'high',
          fps: this.getNodeParameter('fps', itemIndex) as number,
          defaultImageDuration: this.getNodeParameter('defaultImageDuration', itemIndex) as number,
          defaultTransition: this.getNodeParameter('defaultTransition', itemIndex) as 'none' | 'fade' | 'dissolve',
          transitionDuration: this.getNodeParameter('transitionDuration', itemIndex) as number,
          kenBurnsEnabled: this.getNodeParameter('kenBurnsEnabled', itemIndex) as boolean,
          kenBurnsZoom: this.getNodeParameter('kenBurnsZoom', itemIndex) as number,
          watermarkEnabled: this.getNodeParameter('watermarkEnabled', itemIndex) as boolean,
          watermarkUrl: this.getNodeParameter('watermarkUrl', itemIndex) as string,
          watermarkPosition: this.getNodeParameter('watermarkPosition', itemIndex) as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
          watermarkOpacity: this.getNodeParameter('watermarkOpacity', itemIndex) as number,
          watermarkScale: this.getNodeParameter('watermarkScale', itemIndex) as number,
          watermarkMargin: this.getNodeParameter('watermarkMargin', itemIndex) as number,
          textOverlayEnabled: this.getNodeParameter('textOverlayEnabled', itemIndex) as boolean,
          textContent: this.getNodeParameter('textContent', itemIndex) as string,
          fontSize: this.getNodeParameter('fontSize', itemIndex) as number,
          fontColor: this.getNodeParameter('fontColor', itemIndex) as string,
          textPosition: this.getNodeParameter('textPosition', itemIndex) as 'top-center' | 'bottom-center',
          logLevel: this.getNodeParameter('logLevel', itemIndex) as 'none' | 'basic',
          cleanupTempFiles: this.getNodeParameter('cleanupTempFiles', itemIndex) as boolean,
        };

        const tmpDir = (process.env.TMPDIR || '/tmp') + '/video_' + Date.now();
        fs.mkdirSync(tmpDir, { recursive: true });
        const tempFiles: string[] = [tmpDir];

        const imagePaths: string[] = [];
        
        if (options.imagesSource === 'binary') {
          const binaryData = items[itemIndex].binary?.[options.imagesBinaryProperty];
          if (!binaryData) throw new Error(`Binary property "${options.imagesBinaryProperty}" not found`);
          const ext = getFileExtension(binaryData.mimeType);
          const filePath = path.join(tmpDir, `img_${imagePaths.length}.${ext}`);
          fs.writeFileSync(filePath, Buffer.from(binaryData.data as any));
          imagePaths.push(filePath);
          tempFiles.push(filePath);
        } else if (options.imagesSource === 'url') {
          for (const url of options.imageUrls) {
            const filePath = path.join(tmpDir, `img_${imagePaths.length}.jpg`);
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, Buffer.from(response.data));
            imagePaths.push(filePath);
            tempFiles.push(filePath);
          }
        }

        let audioPath: string | undefined;
        if (options.audioSource !== 'none') {
          if (options.audioSource === 'url' && options.audioUrl) {
            audioPath = path.join(tmpDir, 'audio.mp3');
            const response = await axios.get(options.audioUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(audioPath, Buffer.from(response.data));
            tempFiles.push(audioPath);
          }
        }

        const resolution = options.resolution === 'custom' ? { width: options.customWidth, height: options.customHeight } : RESOLUTION_PRESETS[options.resolution];
        const quality = QUALITY_PRESETS[options.quality];
        const outputExt = options.outputFormat === 'webm' ? 'webm' : 'mp4';
        const outputPath = path.join(tmpDir, `output.${outputExt}`);

        const inputArgs = imagePaths.map((p) => `-i "${p}"`).join(' ');
        const audioArg = audioPath ? ` -i "${audioPath}"` : '';
        const codec = options.outputFormat === 'webm' ? 'libvpx-vp9' : (options.outputFormat === 'mp4-h265' ? 'libx265' : 'libx264');

        let filterParts: string[] = [];
        imagePaths.forEach((imgPath, i) => {
          filterParts.push(`[${i}:v]scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2[v${i}]`);
        });

        const concatInputs = imagePaths.map((_, i) => `[v${i}]`).join('');
        filterParts.push(`[${concatInputs}]concat=n=${imagePaths.length}:v=1:a=0[vtemp]`);

        const cmd = `ffmpeg ${inputArgs}${audioArg} -filter_complex "${filterParts.join(';')}" -c:v ${codec} -crf ${quality.crf} -c:a aac -b:a 192k -s ${resolution.width}x${resolution.height} -r ${options.fps} -pix_fmt yuv420p -y "${outputPath}"`;

        if (options.logLevel !== 'none') {
          console.log('Creating video with FFmpeg...');
        }

        await new Promise<void>((resolve, reject) => {
          exec(cmd, (error) => {
            if (error) reject(error);
            else resolve();
          });
        });

        if (!fs.existsSync(outputPath)) {
          throw new Error('FFmpeg did not produce output file');
        }

        const fileBuffer = fs.readFileSync(outputPath);
        const isWebm = options.outputFormat === 'webm';

        result[0].push({
          binary: {
            data: {
              data: fileBuffer,
              mimeType: isWebm ? 'video/webm' : 'video/mp4',
              fileExtension: isWebm ? 'webm' : 'mp4',
              fileName: `video_${Date.now()}.${isWebm ? 'webm' : 'mp4'}`,
            },
          },
          json: { success: true, outputPath, format: options.outputFormat, createdAt: new Date().toISOString() },
        });

        if (options.cleanupTempFiles) {
          tempFiles.forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} });
          try { fs.rmdirSync(tmpDir); } catch {}
        }
      } catch (error) {
        result[0].push({
          json: { success: false, error: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    return result;
  }
}

function parseUrls(input: string): string[] {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) return parsed.filter((u: any) => typeof u === 'string');
  } catch {}
  const matches = input.match(urlPattern);
  return matches || [];
}

function getFileExtension(mimeType?: string): string {
  const map: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  return mimeType ? map[mimeType] || 'jpg' : 'jpg';
}
