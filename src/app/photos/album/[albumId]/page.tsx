"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PhotoLightbox } from "../../../../components/PhotoLightbox";

interface Album {
  id: string;
  title: string;
  description?: string;
  privacy: string;
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  _count: {
    photos: number;
  };
}

interface Photo {
  id: string;
  url: string;
  description?: string;
  createdAt: string;
}

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = params?.albumId as string;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [lightboxPhotoId, setLightboxPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (albumId) {
      fetchAlbumData();
    }
  }, [albumId]);

  const fetchAlbumData = async () => {
    setLoading(true);
    try {
      const [albumRes, photosRes] = await Promise.all([
        fetch(`/api/albums/${albumId}`),
        fetch(`/api/photos?albumId=${albumId}&limit=100`),
      ]);

      if (albumRes.ok) {
        const data = await albumRes.json();
        setAlbum(data);
      } else {
        router.push("/photos"); // Redirect if not found
        return;
      }

      if (photosRes.ok) {
        const data = await photosRes.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error("Failed to fetch album data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const { url } = await uploadRes.json();

          await fetch("/api/photos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url,
              description: file.name,
              albumId: albumId,
            }),
          });
        }
      }
      fetchAlbumData(); // Refresh
    } catch (error) {
      console.error("Upload failed", error);
      alert("Ошибка при загрузке");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAlbum = async () => {
    if (!confirm("Удалить альбом и все фотографии в нем?")) return;

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/photos");
      } else {
        alert("Не удалось удалить альбом");
      }
    } catch (error) {
      console.error("Failed to delete album", error);
    }
  };

  const handleMovePhoto = async (
    index: number,
    direction: "left" | "right"
  ) => {
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === photos.length - 1) return;

    const newPhotos = [...photos];
    const targetIndex = direction === "left" ? index - 1 : index + 1;

    // Swap
    [newPhotos[index], newPhotos[targetIndex]] = [
      newPhotos[targetIndex],
      newPhotos[index],
    ];
    setPhotos(newPhotos);

    try {
      await fetch(`/api/albums/${albumId}/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: newPhotos.map((p) => p.id) }),
      });
    } catch (error) {
      console.error("Failed to reorder", error);
    }
  };

  const openLightbox = (photoId: string) => {
    setLightboxPhotoId(photoId);
  };

  const closeLightbox = () => {
    setLightboxPhotoId(null);
  };

  const handleNextPhoto = () => {
    if (!lightboxPhotoId) return;
    const currentIndex = photos.findIndex((p) => p.id === lightboxPhotoId);
    if (currentIndex < photos.length - 1) {
      setLightboxPhotoId(photos[currentIndex + 1].id);
    }
  };

  const handlePrevPhoto = () => {
    if (!lightboxPhotoId) return;
    const currentIndex = photos.findIndex((p) => p.id === lightboxPhotoId);
    if (currentIndex > 0) {
      setLightboxPhotoId(photos[currentIndex - 1].id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!album) return null;

  return (
    <main className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/photos"
          className="text-indigo-600 hover:underline mb-4 inline-block"
        >
          ← Назад к альбомам
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{album.title}</h1>
            {album.description && (
              <p className="text-gray-600 mt-2">{album.description}</p>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {photos.length} фото • Создан{" "}
              {new Date().toLocaleDateString("ru-RU")}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsReordering(!isReordering)}
              className={`btn ${
                isReordering
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {isReordering ? "Готово" : "Сортировать"}
            </button>
            <button
              onClick={handleDeleteAlbum}
              className="btn bg-red-50 text-red-600 hover:bg-red-100"
            >
              Удалить альбом
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary"
            >
              {uploading ? "Загрузка..." : "+ Добавить фото"}
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
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
            onClick={() => !isReordering && openLightbox(photo.id)}
          >
            <img
              src={photo.url}
              alt={photo.description || "Photo"}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isReordering ? "scale-95" : "group-hover:scale-105"
              }`}
              loading="lazy"
            />
            {!isReordering && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            )}

            {isReordering && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMovePhoto(index, "left");
                  }}
                  disabled={index === 0}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMovePhoto(index, "right");
                  }}
                  disabled={index === photos.length - 1}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  →
                </button>
              </div>
            )}
          </div>
        ))}
        {photos.length === 0 && (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-lg font-medium text-gray-900">
              В этом альбоме пока нет фотографий
            </h3>
            <p className="text-gray-500 mt-1 mb-4">
              Загрузите первые снимки, чтобы начать историю
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-600 font-medium hover:underline"
            >
              Загрузить фото
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhotoId && (
        <PhotoLightbox
          photoId={lightboxPhotoId}
          onClose={closeLightbox}
          onNext={
            photos.findIndex((p) => p.id === lightboxPhotoId) <
            photos.length - 1
              ? handleNextPhoto
              : undefined
          }
          onPrev={
            photos.findIndex((p) => p.id === lightboxPhotoId) > 0
              ? handlePrevPhoto
              : undefined
          }
        />
      )}
    </main>
  );
}
