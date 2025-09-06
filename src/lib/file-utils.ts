import archiver from 'archiver';
import { promises as fs } from 'fs';
import path from 'path';
import { ProcessedSong } from '@/types';

/**
 * Create ZIP archive from multiple files
 */
export async function createZipArchive(
  files: Array<{ path: string; name: string }>,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = require('fs').createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add files to archive
    files.forEach(file => {
      if (require('fs').existsSync(file.path)) {
        archive.file(file.path, { name: file.name });
      }
    });

    archive.finalize();
  });
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(baseFilename: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  const sanitized = baseFilename.replace(/[^\w\s\-_]/g, '').replace(/\s+/g, '_');
  return `${sanitized}_${timestamp}_${random}${extension}`;
}

/**
 * Sanitize filename for safe file system use
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w\s\-_\.]/g, '') // Remove special characters except spaces, hyphens, underscores, dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .trim();
}

/**
 * Get MIME type for file extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.zip': 'application/zip',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Ensure directory exists
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Copy file to destination
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  try {
    await fs.copyFile(source, destination);
  } catch (error) {
    throw new Error(`Failed to copy file from ${source} to ${destination}`);
  }
}

/**
 * Move file to destination
 */
export async function moveFile(source: string, destination: string): Promise<void> {
  try {
    await fs.rename(source, destination);
  } catch (error) {
    // If rename fails, try copy then delete
    try {
      await copyFile(source, destination);
      await fs.unlink(source);
    } catch (fallbackError) {
      throw new Error(`Failed to move file from ${source} to ${destination}`);
    }
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  created: Date;
  modified: Date;
  exists: boolean;
}> {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    };
  } catch {
    return {
      size: 0,
      created: new Date(),
      modified: new Date(),
      exists: false,
    };
  }
}

/**
 * Clean up old temporary files
 */
export async function cleanupOldFiles(
  directory: string,
  maxAgeHours: number = 24
): Promise<void> {
  try {
    const files = await fs.readdir(directory);
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    for (const filename of files) {
      const filePath = path.join(directory, filename);
      const stats = await getFileStats(filePath);
      
      if (stats.exists && stats.modified.getTime() < cutoffTime) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error(`Failed to delete old file: ${filePath}`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to cleanup directory: ${directory}`, error);
  }
}

/**
 * Create download info object
 */
export function createDownloadInfo(
  filePath: string,
  baseUrl: string,
  song?: ProcessedSong
) {
  const filename = path.basename(filePath);
  const extension = path.extname(filePath);
  const downloadUrl = `${baseUrl}/api/files/download/${encodeURIComponent(filename)}`;

  return {
    filename,
    path: filePath,
    size: 0, // Will be set by caller
    mimeType: getMimeType(extension),
    downloadUrl,
    song,
  };
}

/**
 * Validate file is safe to download
 */
export function validateDownloadFile(filePath: string): boolean {
  const allowedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.zip'];
  const extension = path.extname(filePath).toLowerCase();
  
  return allowedExtensions.includes(extension);
}

/**
 * Get human readable file size
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${Math.round(size * 100) / 100} ${sizes[i]}`;
}