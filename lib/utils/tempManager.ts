import * as fs from 'fs';
import * as path from 'path';

export interface TempFile {
  path: string;
  removeCallback: () => void;
}

export interface TempDir {
  path: string;
  removeCallback: () => void;
}

class TempManager {
  private static instance: TempManager;
  private tempDirs: TempDir[] = [];
  private tempFiles: TempFile[] = [];

  private constructor() {}

  static getInstance(): TempManager {
    if (!TempManager.instance) {
      TempManager.instance = new TempManager();
    }
    return TempManager.instance;
  }

  createTempDir(prefix?: string): TempDir {
    const tmpDir = process.env.TMPDIR || '/tmp';
    const tempPath = fs.mkdtempSync(`${tmpDir}/${prefix || 'vm_'}`);
    
    const tempDir: TempDir = {
      path: tempPath,
      removeCallback: () => {
        this.cleanupDir(tempPath);
        this.tempDirs = this.tempDirs.filter(d => d.path !== tempPath);
      },
    };

    this.tempDirs.push(tempDir);
    return tempDir;
  }

  createTempFile(prefix?: string, suffix?: string): TempFile {
    const tmpDir = process.env.TMPDIR || '/tmp';
    const fileName = `${prefix || 'file'}_${Date.now()}${suffix || '.tmp'}`;
    const tempPath = path.join(tmpDir, fileName);
    fs.writeFileSync(tempPath, Buffer.alloc(0));

    const tempFile: TempFile = {
      path: tempPath,
      removeCallback: () => {
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch {
        }
        this.tempFiles = this.tempFiles.filter(f => f.path !== tempPath);
      },
    };

    this.tempFiles.push(tempFile);
    return tempFile;
  }

  private cleanupDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          this.cleanupDir(fullPath);
        } else {
          try { fs.unlinkSync(fullPath); } catch {}
        }
      }
      fs.rmdirSync(dirPath);
    } catch {}
  }

  cleanup(files: string[]): void {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch {}
    }
  }

  cleanupTempDir(tempDir: TempDir): void {
    this.cleanupDir(tempDir.path);
    tempDir.removeCallback();
  }

  getFileExtension(mimeType?: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
      'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav',
    };
    return mimeType ? mimeToExt[mimeType] || 'tmp' : 'tmp';
  }
}

export const tempManager = TempManager.getInstance();
