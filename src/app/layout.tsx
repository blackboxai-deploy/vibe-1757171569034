import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Music Downloader",
  description: "Download songs from Spotify playlists as MP3 files using YouTube as the audio source",
  keywords: ["music", "downloader", "spotify", "youtube", "mp3", "playlist"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}