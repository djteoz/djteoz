"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  views: number;
  uploader: {
    username: string;
  };
}

export default function VideoClient({
  initialVideos,
}: {
  initialVideos: Video[];
}) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!file || !title) return;

    try {
      // 1. Get signature
      const signRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
      });

      if (!signRes.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { timestamp, folder, signature, api_key, cloud_name } =
        await signRes.json();

      // 2. Upload directly to Cloudinary
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("api_key", api_key);
      uploadFormData.append("timestamp", timestamp.toString());
      uploadFormData.append("signature", signature);
      uploadFormData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error?.message || "Cloudinary upload failed");
      }

      const uploadData = await uploadRes.json();
      const url = uploadData.secure_url;

      // 3. Create video entry
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          url,
          thumbnail: null, // Could generate thumbnail later
        }),
      });

      if (!res.ok) throw new Error("Failed to save video");

      const newVideo = await res.json();
      setVideos([newVideo, ...videos]);
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
        <h2 className="text-xl font-bold text-gray-800">Видеозаписи</h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn btn-primary text-sm"
        >
          {showUpload ? "Отмена" : "Загрузить видео"}
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
                placeholder="Название видео"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Описание
              </label>
              <textarea
                name="description"
                className="input mt-1"
                placeholder="О чем это видео?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Файл (MP4/WebM)
              </label>
              <input
                type="file"
                name="file"
                accept="video/*"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="card p-0 overflow-hidden group">
            <div className="aspect-video bg-black relative">
              <video
                src={video.url}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 truncate">
                {video.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {video.description}
              </p>
              <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                <span>{video.views} просмотров</span>
                <span>{video.uploader.username}</span>
              </div>
            </div>
          </div>
        ))}

        {videos.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            Нет видео. Загрузите первое видео!
          </div>
        )}
      </div>
    </div>
  );
}
