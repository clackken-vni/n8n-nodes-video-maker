import { execSync, exec } from 'child_process';
import { platform, arch } from 'os';
import * as path from 'path';
import * as fs from 'fs';
import ffmpegStatic from 'ffmpeg-static';

export interface FFmpegInstallation {
  path: string;
  version: string;
  isSystemFFmpeg: boolean;
}

export interface InstallationResult {
  success: boolean;
  ffmpeg?: FFmpegInstallation;
  error?: string;
}

class FFmpegInstaller {
  private static instance: FFmpegInstaller;
  private cachedInstallation: FFmpegInstallation | null = null;

  private constructor() {}

  static getInstance(): FFmpegInstaller {
    if (!FFmpegInstaller.instance) {
      FFmpegInstaller.instance = new FFmpegInstaller();
    }
    return FFmpegInstaller.instance;
  }

  async checkInstallation(): Promise<InstallationResult> {
    if (this.cachedInstallation) {
      return { success: true, ffmpeg: this.cachedInstallation };
    }

    try {
      const systemFFmpeg = this.findSystemFFmpeg();
      if (systemFFmpeg) {
        this.cachedInstallation = systemFFmpeg;
        return { success: true, ffmpeg: systemFFmpeg };
      }

      const staticFFmpeg = this.findStaticFFmpeg();
      if (staticFFmpeg) {
        this.cachedInstallation = staticFFmpeg;
        return { success: true, ffmpeg: staticFFmpeg };
      }

      return {
        success: false,
        error: 'FFmpeg not found. Please install FFmpeg or it will be auto-installed from ffmpeg-static.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error checking FFmpeg',
      };
    }
  }

  private findSystemFFmpeg(): FFmpegInstallation | null {
    try {
      const versionOutput = execSync('ffmpeg -version', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const versionMatch = versionOutput.match(/ffmpeg version (\S+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';

      const ffmpegPath = execSync('which ffmpeg', { encoding: 'utf-8' }).trim();

      return {
        path: ffmpegPath,
        version,
        isSystemFFmpeg: true,
      };
    } catch {
      return null;
    }
  }

  private findStaticFFmpeg(): FFmpegInstallation | null {
    try {
      if (ffmpegStatic) {
        const resolvedPath = path.resolve(ffmpegStatic);

        if (fs.existsSync(resolvedPath)) {
          return {
            path: resolvedPath,
            version: 'static (from ffmpeg-static)',
            isSystemFFmpeg: false,
          };
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  async install(): Promise<InstallationResult> {
    const os = platform();
    const architecture = arch();

    try {
      switch (os) {
        case 'darwin':
          await this.installMacOS();
          break;
        case 'linux':
          await this.installLinux();
          break;
        case 'win32':
          await this.installWindows();
          break;
        default:
          return {
            success: false,
            error: `Unsupported operating system: ${os}`,
          };
      }

      const result = await this.checkInstallation();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed',
      };
    }
  }

  private async installMacOS(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        exec('which brew', (error) => {
          if (error) {
            reject(new Error('Homebrew not found. Please install Homebrew first: https://brew.sh'));
            return;
          }

          exec('brew install ffmpeg', (installError, stdout, stderr) => {
            if (installError) {
              reject(new Error(`Failed to install FFmpeg: ${stderr}`));
              return;
            }
            resolve();
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async installLinux(): Promise<void> {
    return new Promise((resolve, reject) => {
      const aptCommand = 'apt-get update && apt-get install -y ffmpeg';
      const yumCommand = 'yum install -y ffmpeg';

      exec(aptCommand, (error, stdout, stderr) => {
        if (error) {
          exec(yumCommand, (yumError, yumStdout, yumStderr) => {
            if (yumError) {
              reject(new Error(`Failed to install FFmpeg. Tried apt and yum.\napt error: ${stderr}\nyum error: ${yumStderr}`));
              return;
            }
            resolve();
          });
          return;
        }
        resolve();
      });
    });
  }

  private async installWindows(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec('where choco', (chocoError) => {
        if (chocoError) {
          exec('where winget', (wingetError) => {
            if (wingetError) {
              reject(new Error('Package manager not found. Please install Chocolatey or Winget first.'));
              return;
            }

            exec('winget install FFmpeg', (installError, stdout, stderr) => {
              if (installError) {
                reject(new Error(`Failed to install FFmpeg via Winget: ${stderr}`));
                return;
              }
              resolve();
            });
          });
          return;
        }

        exec('choco install ffmpeg -y', (installError, stdout, stderr) => {
          if (installError) {
            reject(new Error(`Failed to install FFmpeg via Chocolatey: ${stderr}`));
            return;
          }
          resolve();
        });
      });
    });
  }

  getFFmpegPath(): string | null {
    const result = this.findSystemFFmpeg();
    if (result) return result.path;

    if (ffmpegStatic) {
      return path.resolve(ffmpegStatic);
    }

    return null;
  }

  clearCache(): void {
    this.cachedInstallation = null;
  }
}

export const ffmpegInstaller = FFmpegInstaller.getInstance();
export { FFmpegInstaller };
