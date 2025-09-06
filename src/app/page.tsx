"use client";

import { useState } from "react";
import { UrlInputForm } from "@/components/UrlInputForm";
import { ProgressTracker } from "@/components/ProgressTracker";
import { DownloadResults } from "@/components/DownloadResults";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { PlaylistDownloadStatus, DownloadProgress } from "@/types";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<PlaylistDownloadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentDownload, setCurrentDownload] = useState<DownloadProgress | null>(null);

  const handleUrlSubmit = async (url: string, downloadType: 'single' | 'playlist' | 'zip') => {
    setIsProcessing(true);
    setError(null);
    setDownloadStatus(null);
    setCurrentDownload(null);

    try {
      // Extract Spotify metadata
      const extractResponse = await fetch('/api/spotify/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const extractData = await extractResponse.json();
      
      if (!extractData.success) {
        throw new Error(extractData.error || 'Failed to extract Spotify data');
      }

      const { type, songs, playlistName } = extractData.data;

      if (type === 'track') {
        // Single song download
        await downloadSingleSong(songs[0]);
      } else if (type === 'playlist' && (downloadType === 'playlist' || downloadType === 'zip')) {
        // Playlist download
        await downloadPlaylist(songs, playlistName, downloadType);
      }

    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingleSong = async (song: any) => {
    const downloadProgress: DownloadProgress = {
      songId: song.id,
      title: song.title,
      artist: song.artist,
      status: 'searching',
      progress: 0,
    };

    setCurrentDownload(downloadProgress);

    try {
      const response = await fetch('/api/download/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song }),
      });

      const result = await response.json();

      if (result.success) {
        setCurrentDownload({
          ...downloadProgress,
          status: 'completed',
          progress: 100,
          downloadUrl: result.data.downloadUrl,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setCurrentDownload({
        ...downloadProgress,
        status: 'error',
        error: err instanceof Error ? err.message : 'Download failed',
      });
    }
  };

  const downloadPlaylist = async (songs: any[], playlistName: string, downloadType: 'playlist' | 'zip') => {
    const initialStatus: PlaylistDownloadStatus = {
      playlistName,
      totalSongs: songs.length,
      completedSongs: 0,
      failedSongs: 0,
      songs: songs.map(song => ({
        songId: song.id,
        title: song.title,
        artist: song.artist,
        status: 'pending' as const,
        progress: 0,
      })),
      status: 'processing',
    };

    setDownloadStatus(initialStatus);

    try {
      const endpoint = downloadType === 'zip' ? '/api/download/zip' : '/api/download/playlist';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songs, playlistName }),
      });

      const result = await response.json();

      if (result.success) {
        setDownloadStatus({
          ...initialStatus,
          status: 'completed',
          completedSongs: result.data.completedSongs,
          failedSongs: result.data.failedSongs,
          songs: result.data.songs,
          zipUrl: result.data.zipUrl,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setDownloadStatus({
        ...initialStatus,
        status: 'error',
      });
      setError(err instanceof Error ? err.message : 'Playlist download failed');
    }
  };

  const resetState = () => {
    setIsProcessing(false);
    setDownloadStatus(null);
    setError(null);
    setCurrentDownload(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
          Music Downloader
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Download songs from Spotify playlists as MP3 files. Simply paste a Spotify playlist or track URL and let us handle the rest.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* URL Input Form */}
        <UrlInputForm 
          onSubmit={handleUrlSubmit}
          isProcessing={isProcessing}
          onReset={resetState}
        />

        {/* Error Display */}
        {error && (
          <ErrorDisplay 
            error={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Progress Tracking */}
        {(currentDownload || downloadStatus) && (
          <ProgressTracker
            currentDownload={currentDownload}
            playlistStatus={downloadStatus}
          />
        )}

        {/* Download Results */}
        {(currentDownload?.status === 'completed' || downloadStatus?.status === 'completed') && (
          <DownloadResults
            currentDownload={currentDownload}
            playlistStatus={downloadStatus}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-700 text-center text-gray-400">
        <div className="space-y-2">
          <p>
            This app extracts metadata from Spotify and downloads audio from YouTube.
          </p>
          <p className="text-sm">
            No Spotify DRM bypass - only public metadata is used.
          </p>
        </div>
      </footer>
    </div>
  );
}