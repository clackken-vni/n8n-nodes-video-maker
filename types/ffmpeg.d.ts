declare module 'fluent-ffmpeg' {
  import { EventEmitter } from 'events';

  interface FfmpegCommand extends EventEmitter {
    input(input: string): FfmpegCommand;
    inputFormat(format: string): FfmpegCommand;
    inputOptions(options: string[] | string): FfmpegCommand;
    output(output: string): FfmpegCommand;
    outputFormat(format: string): FfmpegCommand;
    videoCodec(codec: string): FfmpegCommand;
    audioCodec(codec: string): FfmpegCommand;
    size(size: string): FfmpegCommand;
    fps(fps: number): FfmpegCommand;
    outputOptions(options: string[] | string): FmmpegCommand;
    complexFilter(filter: string | string[]): FfmpegCommand;
    on(event: string, listener: (...args: any[]) => void): FfmpegCommand;
    run(): void;
  }

  function ffmpeg(path?: string): FfmpegCommand;

  export = ffmpeg;
}
