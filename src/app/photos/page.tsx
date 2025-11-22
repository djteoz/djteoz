import React from "react";

export default function PhotosPage() {
  // Mock data for now
  const photos = [
    { id: 1, src: "https://picsum.photos/400/600", alt: "Летний отдых" },
    { id: 2, src: "https://picsum.photos/400/400", alt: "Кофе брейк" },
    { id: 3, src: "https://picsum.photos/600/400", alt: "Горы" },
    { id: 4, src: "https://picsum.photos/400/500", alt: "Прогулка" },
    { id: 5, src: "https://picsum.photos/500/400", alt: "Архитектура" },
    { id: 6, src: "https://picsum.photos/400/400", alt: "Друзья" },
    { id: 7, src: "https://picsum.photos/300/500", alt: "Концерт" },
    { id: 8, src: "https://picsum.photos/500/300", alt: "Закат" },
  ];

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
            Галерея
          </h1>
          <p className="text-gray-600 mt-1">Ваши лучшие моменты</p>
        </div>
        <button className="btn btn-primary">+ Загрузить фото</button>
      </div>

      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
          >
            <img
              src={photo.src}
              alt={photo.alt}
              className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white font-medium">{photo.alt}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (Hidden for now as we have mock data) */}
      {photos.length === 0 && (
        <div className="card text-center py-20">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-gray-800">
            Нет фотографий
          </h3>
          <p className="text-gray-500 mt-2">
            Загрузите свои первые фотографии, чтобы они появились здесь
          </p>
        </div>
      )}
    </main>
  );
}
