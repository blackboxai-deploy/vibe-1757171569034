import { NextRequest, NextResponse } from 'next/server';
import { createTempDirectory, downloadSongWithProgress } from '@/lib/youtube';
import { createDownloadInfo, getFileStats } from '@/lib/file-utils';
import { ApiResponse, ProcessedSong } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { song } = await request.json();

    // Validate input
    if (!song || !song.title || !song.artist) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Song object with title and artist is required'
      }, { status: 400 });
    }

    // Create temporary directory for download
    const tempDir = await createTempDirectory('single-download');

    // Download the song
    const downloadResult = await downloadSongWithProgress(
      song as ProcessedSong,
      tempDir
    );

    if (!downloadResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: downloadResult.error || 'Download failed'
      }, { status: 500 });
    }

    // Get file stats
    const fileStats = await getFileStats(downloadResult.filePath!);
    
    if (!fileStats.exists) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Downloaded file not found'
      }, { status: 500 });
    }

    // Create download info
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const downloadInfo = createDownloadInfo(downloadResult.filePath!, baseUrl, song);
    downloadInfo.size = fileStats.size;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        song: song,
        downloadUrl: downloadInfo.downloadUrl,
        filename: downloadInfo.filename,
        size: downloadInfo.size,
        filePath: downloadResult.filePath
      },
      message: 'Song downloaded successfully'
    });

  } catch (error) {
    console.error('Single download error:', error);
    
    let errorMessage = 'Failed to download song';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('timeout')) {
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
    error: 'Method not allowed. Use POST to download a single song.'
  }, { status: 405 });
}