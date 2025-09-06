"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface UrlInputFormProps {
  onSubmit: (url: string, downloadType: 'single' | 'playlist' | 'zip') => void;
  isProcessing: boolean;
  onReset: () => void;
}

export function UrlInputForm({ onSubmit, isProcessing, onReset }: UrlInputFormProps) {
  const [url, setUrl] = useState("");
  const [downloadType, setDownloadType] = useState<'single' | 'playlist' | 'zip'>('playlist');
  const [urlError, setUrlError] = useState("");

  const validateSpotifyUrl = (url: string): boolean => {
    const spotifyRegex = /^https:\/\/open\.spotify\.com\/(playlist|track)\/[a-zA-Z0-9]+(\?.*)?$/;
    return spotifyRegex.test(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setUrlError("Please enter a Spotify URL");
      return;
    }

    if (!validateSpotifyUrl(url.trim())) {
      setUrlError("Please enter a valid Spotify playlist or track URL");
      return;
    }

    setUrlError("");
    onSubmit(url.trim(), downloadType);
  };

  const handleReset = () => {
    setUrl("");
    setUrlError("");
    setDownloadType('playlist');
    onReset();
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (urlError) {
      setUrlError("");
    }
  };

  return (
    <Card className="w-full bg-black/20 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-white">
          Enter Spotify URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="spotify-url" className="text-gray-300">
              Spotify Playlist or Track URL
            </Label>
            <Input
              id="spotify-url"
              type="url"
              placeholder="https://open.spotify.com/playlist/37i9dQZF1DX..."
              value={url}
              onChange={handleUrlChange}
              className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isProcessing}
            />
            {urlError && (
              <p className="text-sm text-red-400">{urlError}</p>
            )}
          </div>

          {/* Download Type Selection */}
          <div className="space-y-3">
            <Label className="text-gray-300">Download Options</Label>
            <RadioGroup 
              value={downloadType} 
              onValueChange={(value) => setDownloadType(value as 'single' | 'playlist' | 'zip')}
              className="space-y-2"
              disabled={isProcessing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" className="border-gray-600" />
                <Label htmlFor="single" className="text-gray-300 cursor-pointer">
                  Single Song Download (for individual tracks)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="playlist" id="playlist" className="border-gray-600" />
                <Label htmlFor="playlist" className="text-gray-300 cursor-pointer">
                  Individual Downloads (separate files for each song)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zip" id="zip" className="border-gray-600" />
                <Label htmlFor="zip" className="text-gray-300 cursor-pointer">
                  ZIP Archive (all songs in one downloadable file)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Download Music"}
            </Button>
            
            {(url || isProcessing) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* Example URLs */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-400 mb-2">Example URLs:</p>
          <div className="space-y-1 text-xs text-gray-500">
            <p>Playlist: https://open.spotify.com/playlist/37i9dQZF1DX...</p>
            <p>Track: https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}