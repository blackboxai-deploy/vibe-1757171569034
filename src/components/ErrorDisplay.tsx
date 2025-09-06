"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  const getErrorMessage = (error: string) => {
    // Provide user-friendly error messages
    if (error.includes('invalid') && error.includes('url')) {
      return {
        title: 'Invalid URL',
        message: 'Please make sure you\'ve entered a valid Spotify playlist or track URL.',
        suggestions: [
          'Check that the URL starts with https://open.spotify.com/',
          'Make sure the playlist or track is public',
          'Try copying the URL directly from Spotify'
        ]
      };
    }
    
    if (error.includes('not found') || error.includes('404')) {
      return {
        title: 'Content Not Found',
        message: 'The requested Spotify playlist or track could not be found.',
        suggestions: [
          'Verify the URL is correct and accessible',
          'Check if the playlist is public',
          'Try refreshing the Spotify page and copying the URL again'
        ]
      };
    }
    
    if (error.includes('rate limit') || error.includes('429')) {
      return {
        title: 'Rate Limited',
        message: 'Too many requests have been made. Please wait a moment before trying again.',
        suggestions: [
          'Wait a few minutes before making another request',
          'Try again with fewer songs if downloading a large playlist'
        ]
      };
    }
    
    if (error.includes('network') || error.includes('fetch')) {
      return {
        title: 'Network Error',
        message: 'There was a problem connecting to the services.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'If the problem persists, the service may be temporarily unavailable'
        ]
      };
    }
    
    if (error.includes('youtube') || error.includes('search')) {
      return {
        title: 'YouTube Search Error',
        message: 'Unable to find matching songs on YouTube.',
        suggestions: [
          'The song might not be available on YouTube',
          'Try with a different playlist or song',
          'Some regional restrictions may apply'
        ]
      };
    }
    
    if (error.includes('download') || error.includes('audio')) {
      return {
        title: 'Download Error',
        message: 'Failed to download the audio file.',
        suggestions: [
          'The video might be unavailable or restricted',
          'Try again with a different song',
          'Check if the video is still available on YouTube'
        ]
      };
    }

    // Generic error
    return {
      title: 'Error Occurred',
      message: error,
      suggestions: [
        'Try refreshing the page',
        'Check your internet connection',
        'Verify the Spotify URL is correct and accessible'
      ]
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Card className="w-full bg-red-900/20 border-red-700 backdrop-blur-sm">
      <CardContent className="p-6">
        <Alert className="border-red-600 bg-red-900/30">
          <AlertDescription className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-red-300 mb-2">
                {errorInfo.title}
              </h3>
              <p className="text-red-200 mb-4">
                {errorInfo.message}
              </p>
            </div>
            
            {errorInfo.suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-300 mb-2">
                  Suggestions:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
                  {errorInfo.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button
                onClick={onDismiss}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-300 hover:bg-red-800 hover:text-red-200"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}