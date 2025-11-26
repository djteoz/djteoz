"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Album {
  id: string;
  title: string;
  description?: string;
  cover?: string;
  count: number;
  isSystem: boolean;
}

interface Photo {
  id: string;
  url: string;
  description?: string;
  album?: { title: string };
  createdAt: string;
}

export default function PhotosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "albums">("all");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Album Modal
  const [showNewAlbumModal, setShowNewAlbumModal] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [photosRes, albumsRes] = await Promise.all([
        fetch("/api/photos?limit=50"),
        fetch("/api/albums"),
      ]);

      if (photosRes.ok) {
        const data = await photosRes.json();
        setPhotos(data.photos || []);
      }

      if (albumsRes.ok) {
        const data = await albumsRes.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        // 1. Upload to get URL (using existing upload API)
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();

          // 2. Create Photo entry
          await fetch("/api/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url,
              description: file.name,
              // albumId: currentAlbumId // TODO: Support uploading to specific album
            }),
          });
        }
      }

      // Refresh
      fetchData();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Ошибка при загрузке");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle.trim()) return;

    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAlbumTitle,
          description: newAlbumDesc,
        }),
      });

      if (res.ok) {
        setShowNewAlbumModal(false);
        setNewAlbumTitle("");
        setNewAlbumDesc("");
        fetchData(); // Refresh albums
      }
    } catch (error) {
      console.error("Failed to create album", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
            Галерея
          </h1>
          <p className="text-gray-600 mt-1">
            {photos.length} фото • {albums.length} альбомов
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewAlbumModal(true)}
            className="btn bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            📁 Создать альбом
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary"
          >
            {uploading ? "Загрузка..." : "+ Загрузить фото"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 px-2 font-medium transition-colors relative ${
            activeTab === "all"
              ? "text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Все фотографии
          {activeTab === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("albums")}
          className={`pb-3 px-2 font-medium transition-colors relative ${
            activeTab === "albums"
              ? "text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Альбомы
          {activeTab === "albums" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
          )}
        </button>
      </div>

      {activeTab === "all" ? (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100"
            >
              <img
                src={photo.url}
                alt={photo.description || "Photo"}
                className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              {photo.description && (
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-medium truncate">
                    {photo.description}
                  </p>
                </div>
              )}
            </div>
          ))}
          {photos.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-xl font-semibold text-gray-800">
                Нет фотографий
              </h3>
              <p className="text-gray-500 mt-2">
                Загрузите свои первые фотографии
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group cursor-pointer"
              onClick={() => router.push(`/photos/album/${album.id}`)}
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-200 relative mb-3 shadow-md group-hover:shadow-xl transition-all">
                {album.cover ? (
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📁
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {album.title}
              </h3>
              <p className="text-sm text-gray-500">{album.count} фото</p>
            </div>
          ))}
          {albums.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-gray-800">
                Нет альбомов
              </h3>
              <p className="text-gray-500 mt-2">Создайте свой первый альбом</p>
            </div>
          )}
        </div>
      )}

      {/* Create Album Modal */}
      {showNewAlbumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <h2 className="text-2xl font-bold mb-4">Новый альбом</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Например: Отпуск 2025"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  className="input w-full resize-none"
                  rows={3}
                  placeholder="Пару слов об этом альбоме..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewAlbumModal(false)}
                className="btn bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateAlbum}
                disabled={!newAlbumTitle.trim()}
                className="btn btn-primary"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
