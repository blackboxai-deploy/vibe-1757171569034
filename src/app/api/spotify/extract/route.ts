import { NextRequest, NextResponse } from 'next/server';
import { extractSpotifyMetadata, isValidSpotifyUrl } from '@/lib/spotify';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'URL is required and must be a string'
      }, { status: 400 });
    }

    // Validate Spotify URL format
    if (!isValidSpotifyUrl(url)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid Spotify URL format. Please provide a valid Spotify playlist or track URL.'
      }, { status: 400 });
    }

    // Extract metadata from Spotify
    const metadata = await extractSpotifyMetadata(url);

    if (!metadata.songs || metadata.songs.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'No songs found in the provided Spotify URL'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: metadata,
      message: `Successfully extracted ${metadata.songs.length} song(s)`
    });

  } catch (error) {
    console.error('Spotify extraction error:', error);
    
    let errorMessage = 'Failed to extract metadata from Spotify';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Map specific errors to appropriate status codes
      if (error.message.includes('not found') || error.message.includes('not accessible')) {
        statusCode = 404;
      } else if (error.message.includes('invalid') || error.message.includes('format')) {
        statusCode = 400;
      } else if (error.message.includes('credentials') || error.message.includes('authenticate')) {
        statusCode = 401;
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        statusCode = 429;
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
    error: 'Method not allowed. Use POST to extract Spotify metadata.'
  }, { status: 405 });
}