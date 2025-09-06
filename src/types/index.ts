// TypeScript interfaces for the Music Downloader App

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    name: string;
  }>;
  album: {
    name: string;
  };
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: {
    items: Array<{
      track: SpotifyTrack;
    }>;
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface ProcessedSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  spotifyUrl: string;
  filename: string;
}

export interface YouTubeSearchResult {
  id: string;
  title: string;
  url: string;
  duration: string;
  thumbnail: string;
}

export interface DownloadProgress {
  songId: string;
  title: string;
  artist: string;
  status: 'pending' | 'searching' | 'downloading' | 'completed' | 'error';
  progress: number;
  error?: string;
  downloadUrl?: string;
}

export interface PlaylistDownloadStatus {
  playlistName: string;
  totalSongs: number;
  completedSongs: number;
  failedSongs: number;
  songs: DownloadProgress[];
  zipUrl?: string;
  status: 'processing' | 'completed' | 'error';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SpotifyUrlInfo {
  type: 'track' | 'playlist';
  id: string;
  url: string;
}

export interface DownloadRequest {
  type: 'single' | 'playlist';
  spotifyUrl: string;
  songs?: ProcessedSong[];
}

export interface FileDownloadInfo {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
}