"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadProgress, PlaylistDownloadStatus } from "@/types";

interface DownloadResultsProps {
  currentDownload?: DownloadProgress | null;
  playlistStatus?: PlaylistDownloadStatus | null;
}

export function DownloadResults({ currentDownload, playlistStatus }: DownloadResultsProps) {
  if (!currentDownload?.downloadUrl && !playlistStatus?.zipUrl && !playlistStatus?.songs?.some(s => s.downloadUrl)) {
    return null;
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full bg-black/20 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl text-white">
          Download Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Single Song Download */}
        {currentDownload?.downloadUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-white truncate">
                  {currentDownload.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  by {currentDownload.artist}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-green-600 text-green-400">
                  Ready
                </Badge>
                <Button
                  onClick={() => handleDownload(currentDownload.downloadUrl!, `${currentDownload.artist} - ${currentDownload.title}.mp3`)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Download MP3
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Playlist Downloads */}
        {playlistStatus && (
          <div className="space-y-4">
            {/* ZIP Download (if available) */}
            {playlistStatus.zipUrl && (
              <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      Complete Playlist Archive
                    </h3>
                    <p className="text-sm text-gray-400">
                      {playlistStatus.playlistName} - All songs in one ZIP file
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDownload(playlistStatus.zipUrl!, `${playlistStatus.playlistName}.zip`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Download ZIP
                  </Button>
                </div>
              </div>
            )}

            {/* Individual Song Downloads */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">
                Individual Downloads:
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {playlistStatus.songs
                  .filter(song => song.downloadUrl)
                  .map((song) => (
                    <div key={song.songId} className="flex items-center justify-between p-3 bg-gray-900/30 rounded border border-gray-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {song.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          by {song.artist}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-green-600 text-green-400 text-xs">
                          Ready
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(song.downloadUrl!, `${song.artist} - ${song.title}.mp3`)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Failed Downloads */}
            {playlistStatus.songs.some(song => song.status === 'error') && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-400">
                  Failed Downloads:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {playlistStatus.songs
                    .filter(song => song.status === 'error')
                    .map((song) => (
                      <div key={song.songId} className="flex items-center justify-between p-3 bg-red-900/20 rounded border border-red-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {song.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            by {song.artist}
                          </p>
                          {song.error && (
                            <p className="text-xs text-red-400 mt-1">
                              {song.error}
                            </p>
                          )}
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Failed
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">
                  Download Summary:
                </span>
                <div className="space-x-4">
                  <span className="text-green-400">
                    ✓ {playlistStatus.completedSongs} successful
                  </span>
                  {playlistStatus.failedSongs > 0 && (
                    <span className="text-red-400">
                      ✗ {playlistStatus.failedSongs} failed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Downloads will start automatically. If a download doesn't start, check your browser's download settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}