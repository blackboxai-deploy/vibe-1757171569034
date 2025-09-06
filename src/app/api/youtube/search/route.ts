import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeForSong, validateYtDlpInstallation } from '@/lib/youtube';
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

    // Validate yt-dlp installation
    const ytDlpAvailable = await validateYtDlpInstallation();
    if (!ytDlpAvailable) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'yt-dlp is not installed or not accessible. Please install yt-dlp to enable downloads.'
      }, { status: 500 });
    }

    // Search for song on YouTube
    const youtubeResult = await searchYouTubeForSong(song as ProcessedSong);

    if (!youtubeResult) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `No YouTube results found for "${song.artist} - ${song.title}"`
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        song: song,
        youtubeResult: youtubeResult
      },
      message: 'Successfully found YouTube match'
    });

  } catch (error) {
    console.error('YouTube search error:', error);
    
    let errorMessage = 'Failed to search YouTube';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('yt-dlp')) {
        statusCode = 500;
        errorMessage = 'YouTube download service is unavailable';
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
    error: 'Method not allowed. Use POST to search YouTube.'
  }, { status: 405 });
}