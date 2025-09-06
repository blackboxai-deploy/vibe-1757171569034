"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DownloadProgress, PlaylistDownloadStatus } from "@/types";

interface ProgressTrackerProps {
  currentDownload?: DownloadProgress | null;
  playlistStatus?: PlaylistDownloadStatus | null;
}

export function ProgressTracker({ currentDownload, playlistStatus }: ProgressTrackerProps) {
  if (!currentDownload && !playlistStatus) {
    return null;
  }

  const getStatusBadge = (status: DownloadProgress['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Pending' },
      searching: { variant: 'default' as const, text: 'Searching' },
      downloading: { variant: 'default' as const, text: 'Downloading' },
      completed: { variant: 'default' as const, text: 'Completed' },
      error: { variant: 'destructive' as const, text: 'Error' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.text}
      </Badge>
    );
  };

  const getStatusColor = (status: DownloadProgress['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'downloading': return 'bg-blue-500';
      case 'searching': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full bg-black/20 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl text-white">
          {currentDownload ? 'Download Progress' : 'Playlist Progress'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single Song Progress */}
        {currentDownload && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-white truncate">
                  {currentDownload.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  by {currentDownload.artist}
                </p>
              </div>
              {getStatusBadge(currentDownload.status)}
            </div>
            
            <Progress 
              value={currentDownload.progress} 
              className="h-2"
            />
            
            {currentDownload.error && (
              <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                Error: {currentDownload.error}
              </p>
            )}
          </div>
        )}

        {/* Playlist Progress */}
        {playlistStatus && (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  {playlistStatus.playlistName}
                </h3>
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {playlistStatus.completedSongs} / {playlistStatus.totalSongs}
                </Badge>
              </div>
              
              <Progress 
                value={(playlistStatus.completedSongs / playlistStatus.totalSongs) * 100} 
                className="h-3"
              />
              
              <div className="flex justify-between text-sm text-gray-400">
                <span>Completed: {playlistStatus.completedSongs}</span>
                <span>Failed: {playlistStatus.failedSongs}</span>
                <span>Total: {playlistStatus.totalSongs}</span>
              </div>
            </div>

            {/* Individual Song Progress */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-300 sticky top-0 bg-black/40 py-1">
                Song Details:
              </h4>
              {playlistStatus.songs.map((song) => (
                <div key={song.songId} className="flex items-center gap-3 p-2 bg-gray-900/30 rounded">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(song.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(song.status)}
                    {song.progress > 0 && (
                      <span className="text-xs text-gray-400">
                        {song.progress}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Status Message */}
            {playlistStatus.status === 'processing' && (
              <div className="text-center text-sm text-blue-400 bg-blue-900/20 p-3 rounded">
                Processing playlist... This may take a few minutes.
              </div>
            )}
            
            {playlistStatus.status === 'completed' && (
              <div className="text-center text-sm text-green-400 bg-green-900/20 p-3 rounded">
                Playlist processing completed! 
                {playlistStatus.failedSongs > 0 && (
                  <span className="block text-yellow-400 mt-1">
                    {playlistStatus.failedSongs} songs failed to download.
                  </span>
                )}
              </div>
            )}
            
            {playlistStatus.status === 'error' && (
              <div className="text-center text-sm text-red-400 bg-red-900/20 p-3 rounded">
                Playlist processing failed. Please try again.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}