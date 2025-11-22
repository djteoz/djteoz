"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string | null;
  duration: number | null;
  uploader: {
    username: string;
  };
}

export default function MusicClient({
  initialTracks,
}: {
  initialTracks: Track[];
}) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      // Wait for render then play
      setTimeout(() => audioRef.current?.play(), 0);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;

    if (!file || !title || !artist) return;

    try {
      // 1. Upload file
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // 2. Create music entry
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          url,
          cover: null, // Optional cover upload could be added later
        }),
      });

      if (!res.ok) throw new Error("Failed to save music");

      const newTrack = await res.json();
      setTracks([newTrack, ...tracks]);
      setShowUpload(false);
      router.refresh();
    } catch (error) {
      alert("Ошибка при загрузке");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Моя музыка</h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn btn-primary text-sm"
        >
          {showUpload ? "Отмена" : "Загрузить трек"}
        </button>
      </div>

      {showUpload && (
        <div className="card p-4 bg-indigo-50 border border-indigo-100 animate-fade-in">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Название
              </label>
              <input
                name="title"
                required
                className="input mt-1"
                placeholder="Название трека"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Исполнитель
              </label>
              <input
                name="artist"
                required
                className="input mt-1"
                placeholder="Исполнитель"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Файл (MP3)
              </label>
              <input
                type="file"
                name="file"
                accept="audio/*"
                required
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <button
              disabled={isUploading}
              type="submit"
              className="btn btn-primary w-full"
            >
              {isUploading ? "Загрузка..." : "Сохранить"}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`flex items-center p-3 rounded-xl transition-all cursor-pointer hover:bg-white/80 ${
              currentTrack?.id === track.id
                ? "bg-white shadow-md border-l-4 border-indigo-500"
                : "bg-white/40"
            }`}
            onClick={() => playTrack(track)}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-4 shrink-0">
              {currentTrack?.id === track.id && isPlaying ? (
                <div className="flex gap-0.5 h-4 items-end">
                  <div className="w-1 bg-indigo-600 animate-[bounce_1s_infinite] h-2"></div>
                  <div className="w-1 bg-indigo-600 animate-[bounce_1.2s_infinite] h-4"></div>
                  <div className="w-1 bg-indigo-600 animate-[bounce_0.8s_infinite] h-3"></div>
                </div>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium truncate ${
                  currentTrack?.id === track.id
                    ? "text-indigo-700"
                    : "text-gray-900"
                }`}
              >
                {track.title}
              </h3>
              <p className="text-sm text-gray-500 truncate">{track.artist}</p>
            </div>
            <div className="text-xs text-gray-400 ml-2">
              {track.duration
                ? `${Math.floor(track.duration / 60)}:${(track.duration % 60)
                    .toString()
                    .padStart(2, "0")}`
                : ""}
            </div>
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            Нет музыки. Загрузите первый трек!
          </div>
        )}
      </div>

      {/* Fixed Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 p-4 shadow-lg z-50 md:pl-64">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">
                {currentTrack.title}
              </h4>
              <p className="text-sm text-gray-500 truncate">
                {currentTrack.artist}
              </p>
            </div>
            <audio
              ref={audioRef}
              src={currentTrack.url}
              controls
              autoPlay
              className="w-full max-w-md"
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
