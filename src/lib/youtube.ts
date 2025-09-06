import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { ProcessedSong, YouTubeSearchResult } from '@/types';

/**
 * Search for a song on YouTube using ytdl-core
 */
export async function searchYouTubeForSong(song: ProcessedSong): Promise<YouTubeSearchResult | null> {
  const query = `${song.artist} ${song.title}`;
  
  try {
    // Use yt-dlp to search for the song
    const searchResults = await executeYtDlpSearch(query);
    
    if (searchResults.length === 0) {
      throw new Error(`No YouTube results found for: ${query}`);
    }

    // Return the first (most relevant) result
    return searchResults[0];
  } catch (error) {
    console.error(`YouTube search failed for ${song.title}:`, error);
    return null;
  }
}

/**
 * Execute yt-dlp search command
 */
async function executeYtDlpSearch(query: string): Promise<YouTubeSearchResult[]> {
  return new Promise((resolve, reject) => {
    const args = [
      '--quiet',
      '--no-warnings',
      '--dump-json',
      '--playlist-items', '1',
      `ytsearch1:${query}`
    ];

    const ytdlp = spawn('yt-dlp', args);
    let output = '';
    let error = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      error += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp search failed: ${error}`));
        return;
      }

      try {
        const lines = output.trim().split('\n').filter(line => line.trim());
        const results: YouTubeSearchResult[] = [];

        for (const line of lines) {
          const data = JSON.parse(line);
          results.push({
            id: data.id,
            title: data.title,
            url: data.webpage_url,
            duration: data.duration_string || 'Unknown',
            thumbnail: data.thumbnail || '',
          });
        }

        resolve(results);
      } catch (parseError) {
        reject(new Error('Failed to parse yt-dlp search results'));
      }
    });
  });
}

/**
 * Download audio from YouTube using yt-dlp
 */
export async function downloadAudioFromYouTube(
  youtubeUrl: string,
  outputPath: string,
  filename: string
): Promise<string> {
  const outputFile = path.join(outputPath, `${filename}.%(ext)s`);
  
  return new Promise((resolve, reject) => {
    const args = [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0', // Best quality
      '--output', outputFile,
      '--no-playlist',
      '--quiet',
      '--no-warnings',
      youtubeUrl
    ];

    const ytdlp = spawn('yt-dlp', args);
    let error = '';

    ytdlp.stderr.on('data', (data) => {
      error += data.toString();
    });

    ytdlp.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Download failed: ${error}`));
        return;
      }

      try {
        // Find the downloaded file (yt-dlp adds the extension)
        const files = await fs.readdir(outputPath);
        const downloadedFile = files.find(file => 
          file.startsWith(filename) && file.endsWith('.mp3')
        );

        if (!downloadedFile) {
          reject(new Error('Downloaded file not found'));
          return;
        }

        resolve(path.join(outputPath, downloadedFile));
      } catch (fsError) {
        reject(new Error('Failed to locate downloaded file'));
      }
    });
  });
}

/**
 * Create temporary download directory
 */
export async function createTempDirectory(prefix: string = 'music-download'): Promise<string> {
  const tempDir = path.join('/tmp', `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  } catch (error) {
    throw new Error('Failed to create temporary directory');
  }
}

/**
 * Clean up temporary directory
 */
export async function cleanupTempDirectory(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to cleanup temp directory:', dirPath, error);
    // Don't throw error for cleanup failures
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Validate yt-dlp installation
 */
export async function validateYtDlpInstallation(): Promise<boolean> {
  return new Promise((resolve) => {
    const ytdlp = spawn('yt-dlp', ['--version']);
    
    ytdlp.on('close', (code) => {
      resolve(code === 0);
    });
    
    ytdlp.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Download song with progress tracking
 */
export async function downloadSongWithProgress(
  song: ProcessedSong,
  outputDir: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Search for the song on YouTube
    if (onProgress) onProgress(10);
    const youtubeResult = await searchYouTubeForSong(song);
    
    if (!youtubeResult) {
      return {
        success: false,
        error: 'Song not found on YouTube'
      };
    }

    if (onProgress) onProgress(30);
    
    // Download the audio
    const sanitizedFilename = song.filename.replace(/[^\w\s\-_]/g, '');
    const filePath = await downloadAudioFromYouTube(
      youtubeResult.url,
      outputDir,
      sanitizedFilename
    );

    if (onProgress) onProgress(100);
    
    return {
      success: true,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown download error'
    };
  }
}