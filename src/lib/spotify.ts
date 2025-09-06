import axios from 'axios';
import { SpotifyTrack, SpotifyPlaylist, ProcessedSong, SpotifyUrlInfo } from '@/types';

// Spotify API configuration
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Get Spotify access token using client credentials flow
 */
export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post<SpotifyTokenResponse>(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Spotify access token:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
}

/**
 * Parse Spotify URL to extract type and ID
 */
export function parseSpotifyUrl(url: string): SpotifyUrlInfo {
  const regex = /https:\/\/open\.spotify\.com\/(playlist|track)\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error('Invalid Spotify URL format');
  }

  const [, type, id] = match;
  
  return {
    type: type as 'track' | 'playlist',
    id,
    url,
  };
}

/**
 * Fetch track details from Spotify API
 */
export async function getSpotifyTrack(trackId: string, accessToken: string): Promise<SpotifyTrack> {
  try {
    const response = await axios.get<SpotifyTrack>(
      `${SPOTIFY_API_BASE}/tracks/${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to fetch Spotify track:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Track not found or not accessible');
    }
    throw new Error('Failed to fetch track from Spotify');
  }
}

/**
 * Fetch playlist details from Spotify API
 */
export async function getSpotifyPlaylist(playlistId: string, accessToken: string): Promise<SpotifyPlaylist> {
  try {
    // First, get basic playlist info
    const playlistResponse = await axios.get(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    // Then get all tracks (handle pagination)
    let allTracks: any[] = [];
    let nextUrl = `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=50`;

    while (nextUrl) {
      const tracksResponse = await axios.get(nextUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      allTracks = allTracks.concat(tracksResponse.data.items);
      nextUrl = tracksResponse.data.next;
    }

    return {
      ...playlistResponse.data,
      tracks: {
        items: allTracks,
        total: allTracks.length,
      },
    };
  } catch (error) {
    console.error('Failed to fetch Spotify playlist:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Playlist not found or not accessible');
    }
    throw new Error('Failed to fetch playlist from Spotify');
  }
}

/**
 * Process Spotify track into our internal format
 */
export function processSpotifyTrack(track: SpotifyTrack): ProcessedSong {
  const artists = track.artists.map(artist => artist.name).join(', ');
  
  return {
    id: track.id,
    title: track.name,
    artist: artists,
    album: track.album.name,
    duration: track.duration_ms,
    spotifyUrl: track.external_urls.spotify,
    filename: `${artists} - ${track.name}`.replace(/[^a-zA-Z0-9\s\-_]/g, ''),
  };
}

/**
 * Extract metadata from Spotify URL (main function)
 */
export async function extractSpotifyMetadata(url: string) {
  const urlInfo = parseSpotifyUrl(url);
  const accessToken = await getSpotifyAccessToken();

  if (urlInfo.type === 'track') {
    const track = await getSpotifyTrack(urlInfo.id, accessToken);
    const processedSong = processSpotifyTrack(track);
    
    return {
      type: 'track',
      songs: [processedSong],
      playlistName: null,
    };
  } else {
    const playlist = await getSpotifyPlaylist(urlInfo.id, accessToken);
    const processedSongs = playlist.tracks.items
      .filter(item => item.track && item.track.id) // Filter out null/unavailable tracks
      .map(item => processSpotifyTrack(item.track));
    
    return {
      type: 'playlist',
      songs: processedSongs,
      playlistName: playlist.name,
    };
  }
}

/**
 * Validate Spotify URL format
 */
export function isValidSpotifyUrl(url: string): boolean {
  const regex = /^https:\/\/open\.spotify\.com\/(playlist|track)\/[a-zA-Z0-9]+(\?.*)?$/;
  return regex.test(url);
}