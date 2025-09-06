import { NextRequest, NextResponse } from 'next/server';
import { createTempDirectory, downloadSongWithProgress, cleanupTempDirectory } from '@/lib/youtube';
import { createDownloadInfo, getFileStats } from '@/lib/file-utils';
import { ApiResponse, ProcessedSong, PlaylistDownloadStatus, DownloadProgress } from '@/types';

export async function POST(request: NextRequest) {
  let tempDir: string | null = null;

  try {
    const { songs, playlistName } = await request.json();

    // Validate input
    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Songs array is required and must contain at least one song'
      }, { status: 400 });
    }

    const validSongs = songs.filter(song => song && song.title && song.artist);
    if (validSongs.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No valid songs found in the provided array'
      }, { status: 400 });
    }

    // Create temporary directory for downloads
    tempDir = await createTempDirectory('playlist-download');

    // Initialize download status
    const downloadStatus: PlaylistDownloadStatus = {
      playlistName: playlistName || 'Unknown Playlist',
      totalSongs: validSongs.length,
      completedSongs: 0,
      failedSongs: 0,
      songs: validSongs.map(song => ({
        songId: song.id,
        title: song.title,
        artist: song.artist,
        status: 'pending' as const,
        progress: 0,
      })),
      status: 'processing',
    };

    // Download songs concurrently (but limit concurrency)
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '3');
    const downloadPromises: Promise<void>[] = [];
    
    for (let i = 0; i < validSongs.length; i += maxConcurrent) {
      const batch = validSongs.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (song: ProcessedSong, batchIndex: number) => {
        const songIndex = i + batchIndex;
        const songStatus = downloadStatus.songs[songIndex];
        
        try {
          songStatus.status = 'searching';
          
          const downloadResult = await downloadSongWithProgress(
            song,
            tempDir!,
            (progress) => {
              songStatus.progress = progress;
              if (progress > 30) songStatus.status = 'downloading';
            }
          );

          if (downloadResult.success) {
            songStatus.status = 'completed';
            songStatus.progress = 100;
            
            // Create download URL
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const fileStats = await getFileStats(downloadResult.filePath!);
            const downloadInfo = createDownloadInfo(downloadResult.filePath!, baseUrl, song);
            downloadInfo.size = fileStats.size;
            
            songStatus.downloadUrl = downloadInfo.downloadUrl;
            downloadStatus.completedSongs++;
          } else {
            throw new Error(downloadResult.error || 'Download failed');
          }
        } catch (error) {
          songStatus.status = 'error';
          songStatus.error = error instanceof Error ? error.message : 'Unknown error';
          downloadStatus.failedSongs++;
        }
      });

      downloadPromises.push(...batchPromises);
      
      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    downloadStatus.status = 'completed';

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...downloadStatus,
        completedSongs: downloadStatus.completedSongs,
        failedSongs: downloadStatus.failedSongs,
        songs: downloadStatus.songs
      },
      message: `Playlist processing completed. ${downloadStatus.completedSongs} songs downloaded successfully${downloadStatus.failedSongs > 0 ? `, ${downloadStatus.failedSongs} failed` : ''}.`
    });

  } catch (error) {
    console.error('Playlist download error:', error);
    
    // Cleanup temp directory on error
    if (tempDir) {
      try {
        await cleanupTempDirectory(tempDir);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    let errorMessage = 'Failed to download playlist';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('timeout')) {
        statusCode = 408;
      } else if (error.message.includes('yt-dlp') || error.message.includes('YouTube')) {
        statusCode = 503;
        errorMessage = 'Download service temporarily unavailable';
      }
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: 'Method not allowed. Use POST to download a playlist.'
  }, { status: 405 });
}