import { FFmpegProgress, LogCallback } from '../types';

export interface ProgressReporterOptions {
  logLevel: 'none' | 'basic' | 'detailed';
  logCallback?: LogCallback;
  estimatedTotalDuration?: number;
}

export class ProgressReporter {
  private startTime: number;
  private lastProgress: number = 0;
  private progressHistory: { time: number; percent: number }[] = [];
  private readonly logCallback: LogCallback;
  private readonly logLevel: 'none' | 'basic' | 'detailed';

  constructor(options: ProgressReporterOptions) {
    this.startTime = Date.now();
    this.logCallback = options.logCallback || this.defaultLogCallback;
    this.logLevel = options.logLevel;
  }

  private defaultLogCallback = (level: string, message: string): void => {
    console.log(`[${level}] ${message}`);
  };

  reportProgress(progress: FFmpegProgress): void {
    this.progressHistory.push({
      time: Date.now() - this.startTime,
      percent: progress.percent,
    });

    if (this.logLevel === 'detailed') {
      this.logCallback('info', this.formatDetailedProgress(progress));
    } else if (this.logLevel === 'basic' && progress.percent - this.lastProgress >= 5) {
      this.logCallback('info', this.formatBasicProgress(progress));
      this.lastProgress = progress.percent;
    }

    if (progress.percent >= 100) {
      this.finalize();
    }
  }

  private formatBasicProgress(progress: FFmpegProgress): string {
    const elapsed = this.formatTime((Date.now() - this.startTime) / 1000);
    const eta = this.calculateETA(progress.percent);

    return `Progress: ${progress.percent.toFixed(1)}% | ` +
      `Time: ${progress.currentTime} | ` +
      `FPS: ${progress.fps.toFixed(0)} | ` +
      `Speed: ${progress.speed} | ` +
      `Elapsed: ${elapsed} | ` +
      `ETA: ${eta}`;
  }

  private formatDetailedProgress(progress: FFmpegProgress): string {
    const bar = this.createProgressBar(progress.percent);
    const elapsed = this.formatTime((Date.now() - this.startTime) / 1000);
    const eta = this.calculateETA(progress.percent);

    let output = `\n${'='.repeat(60)}\n`;
    output += `${bar} ${progress.percent.toFixed(1)}%\n`;
    output += `${'='.repeat(60)}\n`;
    output += `Current: ${progress.currentTime} / ${progress.totalTime}\n`;
    output += `FPS: ${progress.fps.toFixed(0)} | Bitrate: ${progress.bitrate}\n`;
    output += `Speed: ${progress.speed}\n`;
    output += `Elapsed: ${elapsed} | ETA: ${eta}\n`;
    output += `${'='.repeat(60)}\n`;

    return output;
  }

  private createProgressBar(percent: number, length: number = 30): string {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}]`;
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private calculateETA(percent: number): string {
    if (percent <= 0) return 'Unknown';

    const elapsed = Date.now() - this.startTime;
    const estimatedTotal = (elapsed / percent) * 100;
    const remaining = estimatedTotal - elapsed;

    if (remaining > 60000) {
      return `${Math.round(remaining / 60000)}m`;
    }
    return `${Math.round(remaining / 1000)}s`;
  }

  reportStart(operation: string): void {
    this.logCallback('info', `🚀 Starting: ${operation}`);
    this.logCallback('info', `⏰ Start time: ${new Date().toISOString()}`);
    this.startTime = Date.now();
    this.progressHistory = [];
  }

  reportSuccess(operation: string, outputPath: string): void {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.logCallback('info', `✅ Success: ${operation}`);
    this.logCallback('info', `📁 Output: ${outputPath}`);
    this.logCallback('info', `⏱️ Total time: ${totalTime}s`);
  }

  reportError(operation: string, error: string): void {
    this.logCallback('error', `❌ Error in ${operation}: ${error}`);
  }

  reportWarning(message: string): void {
    this.logCallback('warn', `⚠️ ${message}`);
  }

  reportInfo(message: string): void {
    this.logCallback('info', `ℹ️ ${message}`);
  }

  private finalize(): void {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    this.logCallback('info', `🎉 Encoding completed in ${totalTime}s`);

    if (this.logLevel !== 'none') {
      const avgSpeed = this.calculateAverageSpeed();
      this.logCallback('info', `📊 Average encoding speed: ${avgSpeed}x`);
    }
  }

  private calculateAverageSpeed(): string {
    if (this.progressHistory.length < 2) return 'N/A';

    const totalProgress = this.progressHistory[this.progressHistory.length - 1].percent -
      this.progressHistory[0].percent;
    const totalTime = (this.progressHistory[this.progressHistory.length - 1].time -
      this.progressHistory[0].time) / 1000;

    if (totalProgress <= 0 || totalTime <= 0) return 'N/A';

    return (totalProgress / totalTime).toFixed(2);
  }

  getProgressHistory(): { time: number; percent: number }[] {
    return [...this.progressHistory];
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

export function createProgressReporter(options: ProgressReporterOptions): ProgressReporter {
  return new ProgressReporter(options);
}
