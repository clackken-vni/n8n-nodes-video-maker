import * as childProcess from 'child_process';
import * as fs from 'fs';
import {
  VideoMakerOptions,
  ProcessedImage,
  ProcessedAudio,
  RESOLUTION_PRESETS,
  QUALITY_PRESETS,
  Resolution,
  FFmpegProgress,
  ProgressCallback,
  TransitionType,
} from '../types';

export interface CommandBuilderOptions {
  images: ProcessedImage[];
  audio?: ProcessedAudio;
  options: VideoMakerOptions;
  outputPath: string;
  progressCallback: ProgressCallback;
}

export function createFFmpegCommand(options: CommandBuilderOptions): string {
  const { images, audio, options: opts, outputPath } = options;
  
  if (images.length === 0) {
    throw new Error('No images provided');
  }

  const resolution = getResolution(opts);
  const quality = QUALITY_PRESETS[opts.quality];
  
  const filterComplex = buildFilterComplex(images, resolution, opts);
  const inputArgs = images.map((img) => `-i "${img.path}"`).join(' ');
  
  const audioArgs = audio ? ` -i "${audio.path}"` : '';

  const codec = opts.outputFormat === 'webm' ? 'libvpx-vp9' : (opts.outputFormat === 'mp4-h265' ? 'libx265' : 'libx264');

  let cmd = `ffmpeg ${inputArgs}${audioArgs} `;
  cmd += `-filter_complex "${filterComplex}" `;
  cmd += `-c:v ${codec} `;
  cmd += `-b:v ${quality.videoBitrate} `;
  cmd += `-crf ${quality.crf} `;
  cmd += `-c:a aac `;
  cmd += `-b:a ${quality.audioBitrate} `;
  cmd += `-s ${resolution.width}x${resolution.height} `;
  cmd += `-r ${opts.fps} `;
  cmd += `-pix_fmt yuv420p `;
  cmd += `-y `;
  cmd += `"${outputPath}"`;

  return cmd;
}

function buildFilterComplex(images: ProcessedImage[], resolution: Resolution, options: VideoMakerOptions): string {
  let filters: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let filter = `[${i}:v]`;

    if (img.kenBurnsEnabled) {
      filter += buildKenBurnsFilter(img, resolution, options);
    } else {
      filter += `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,`;
      filter += `pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`;
    }

    filters.push(`${filter}[v${i}_out]`);
  }

  filters.push(`[${images.map((_, i) => `[v${i}_out]`).join('')}]concat=n=${images.length}:v=1:a=0[vtemp]`);

  if (options.watermarkEnabled) {
    const wmIndex = images.length;
    filters.push(`[${wmIndex}:v]scale=iw*${options.watermarkScale / 100}:-1,format=rgba,colorchannelmixer=aa=${options.watermarkOpacity}[wm]`);
    filters.push(`[vtemp][wm]overlay=${getWatermarkPosition(options.watermarkPosition, resolution, options.watermarkMargin)}[vfinal]`);
  } else {
    filters.push('[vtemp][vfinal]');
  }

  return filters.filter(f => f.includes('[')).join(';');
}

function buildKenBurnsFilter(img: ProcessedImage, resolution: Resolution, options: VideoMakerOptions): string {
  const zoom = img.kenBurnsZoom || options.kenBurnsZoom || 1.2;
  const duration = img.duration * options.fps;
  
  let zoomExpr = `'min(zoom+${(zoom - 1) / duration},${zoom})'`;
  let xExpr = `'iw/2-(iw/zoom/2)'`;
  let yExpr = `'ih/2-(ih/zoom/2)'`;

  if (img.kenBurnsDirection === 'zoom-out') {
    zoomExpr = `'max(${zoom}-(zoom-1)*on/${duration},1)'`;
  } else if (img.kenBurnsDirection === 'pan-left') {
    xExpr = `'iw/2-(iw/zoom/2)-(iw/zoom)*(on/${duration})*0.3'`;
  } else if (img.kenBurnsDirection === 'pan-right') {
    xExpr = `'iw/2-(iw/zoom/2)+(iw/zoom)*(on/${duration})*0.3'`;
  }

  return `scale=${resolution.width}:${resolution.height},` +
    `zoompan=z=${zoomExpr}:d=${duration}:x=${xExpr}:y=${yExpr}:s=${resolution.width}x${resolution.height}:fps=${options.fps}`;
}

function getWatermarkPosition(pos: string, resolution: Resolution, margin: number): string {
  const positions: Record<string, string> = {
    'top-left': `${margin}:${margin}`,
    'top-center': `(W-w)/2:${margin}`,
    'top-right': `W-w-${margin}:${margin}`,
    'center-left': `${margin}:(H-h)/2`,
    'center': `(W-w)/2:(H-h)/2`,
    'center-right': `W-w-${margin}:(H-h)/2`,
    'bottom-left': `${margin}:H-h-${margin}`,
    'bottom-center': `(W-w)/2:H-h-${margin}`,
    'bottom-right': `W-w-${margin}:H-h-${margin}`,
  };
  return positions[pos] || `${margin}:${margin}`;
}

function getResolution(options: VideoMakerOptions): Resolution {
  if (options.resolution === 'custom') {
    return { width: options.customWidth || 1920, height: options.customHeight || 1080 };
  }
  return RESOLUTION_PRESETS[options.resolution as keyof typeof RESOLUTION_PRESETS] || RESOLUTION_PRESETS['1080p'];
}

export function executeFFmpeg(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = childProcess.exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve();
    });

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        console.log(data.toString().trim());
      });
    }
  });
}
