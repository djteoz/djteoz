"use client";

import { useState, useRef, useEffect } from "react";
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentTrack]);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 0);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex < tracks.length - 1) {
      playTrack(tracks[currentIndex + 1]);
    } else {
      // Loop to start or stop? Let's stop for now, or loop to first
      setIsPlaying(false);
    }
  };

  const playPrev = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(tracks[currentIndex - 1]);
    } else {
      // Restart current track
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    let url = formData.get("url") as string;
    const file = formData.get("file") as File;

    if (!title || !artist) return;

    try {
      if (uploadMode === "file") {
        if (!file) return;

        // Upload file to Cloudinary via /api/upload
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || "Failed to upload file");
        }

        const uploadData = await uploadRes.json();
        url = uploadData.url;
      }

      // Create music entry
      const res = await fetch("/api/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          url,
          cover: null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save music");
      }

      const newTrack = await res.json();
      setTracks([newTrack, ...tracks]);
      setShowUpload(false);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(`Ошибка при загрузке: ${error.message}`);
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
          <div className="flex gap-4 mb-4 border-b border-indigo-200 pb-2">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`text-sm font-medium pb-1 transition-colors ${
                uploadMode === "file"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Файл (MP3)
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`text-sm font-medium pb-1 transition-colors ${
                uploadMode === "url"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Внешняя ссылка
            </button>
          </div>

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

            {uploadMode === "file" ? (
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
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ссылка на MP3
                </label>
                <input
                  name="url"
                  type="url"
                  required
                  className="input mt-1"
                  placeholder="https://example.com/music.mp3"
                />
              </div>
            )}

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

      <div className="space-y-1">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`group flex items-center p-2 rounded-lg transition-all cursor-pointer hover:bg-gray-100 ${
              currentTrack?.id === track.id ? "bg-indigo-50" : ""
            }`}
            onClick={() => playTrack(track)}
          >
            <div className="relative w-10 h-10 rounded bg-gray-200 overflow-hidden mr-3 shrink-0">
              {track.cover ? (
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
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
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
              )}
              {currentTrack?.id === track.id && isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex gap-0.5 h-3 items-end">
                    <div className="w-0.5 bg-white animate-[bounce_1s_infinite] h-2"></div>
                    <div className="w-0.5 bg-white animate-[bounce_1.2s_infinite] h-3"></div>
                    <div className="w-0.5 bg-white animate-[bounce_0.8s_infinite] h-2"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div
                className={`font-medium text-sm truncate ${
                  currentTrack?.id === track.id
                    ? "text-indigo-600"
                    : "text-gray-900"
                }`}
              >
                {track.title}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {track.artist}
              </div>
            </div>

            <div className="text-xs text-gray-400 ml-4 w-10 text-right">
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
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:pl-64 transition-all duration-300">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 cursor-pointer group">
            <div
              className="h-full bg-indigo-600 relative"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md transform scale-0 group-hover:scale-100 duration-200" />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 w-1/4 min-w-[150px]">
              <div className="w-12 h-12 rounded-md bg-gray-200 overflow-hidden shrink-0 relative group">
                {currentTrack.cover ? (
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <svg
                      className="w-6 h-6"
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
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate hover:underline cursor-pointer">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-gray-500 truncate hover:underline cursor-pointer">
                  {currentTrack.artist}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-6">
                <button
                  onClick={playPrev}
                  className="text-gray-400 hover:text-gray-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11 19V5l-7 7 7 7zm8-14h-2v14h2V5z" />
                  </svg>
                </button>
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-900 transition-all transform hover:scale-105"
                >
                  {isPlaying ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={playNext}
                  className="text-gray-400 hover:text-gray-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 19h2V5H4v14zm13-7l-7-7v14l7-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Volume & Time */}
            <div className="w-1/4 min-w-[150px] flex items-center justify-end gap-3">
              <span className="text-xs text-gray-500 font-medium tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="flex items-center gap-2 group">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
                <div className="w-20 h-1 bg-gray-200 rounded-full relative">
                  <div
                    className="h-full bg-gray-500 rounded-full"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={currentTrack.url}
              autoPlay
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
