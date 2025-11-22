import React from "react";
import Link from "next/link";

export default function CommunitiesPage() {
  const communities = [
    {
      id: 1,
      name: "Разработка игр",
      members: 12500,
      image: "🎮",
      desc: "Обсуждение Unity, Unreal Engine и геймдизайна",
    },
    {
      id: 2,
      name: "Музыка 2025",
      members: 8400,
      image: "🎵",
      desc: "Новинки музыки и клипов",
    },
    {
      id: 3,
      name: "Путешествия",
      members: 5600,
      image: "🌍",
      desc: "Делимся фото и советами",
    },
    {
      id: 4,
      name: "IT Юмор",
      members: 42000,
      image: "💻",
      desc: "Мемы про программистов",
    },
    {
      id: 5,
      name: "Кино и Сериалы",
      members: 15000,
      image: "🎬",
      desc: "Обсуждение новинок кинопроката",
    },
    {
      id: 6,
      name: "Книжный клуб",
      members: 3200,
      image: "📚",
      desc: "Рецензии и обсуждения книг",
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="card p-3 flex items-center gap-3">
            <span className="text-gray-400 pl-2">🔍</span>
            <input
              type="text"
              placeholder="Поиск сообществ"
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400"
            />
            <button className="btn bg-gray-100 text-gray-600 hover:bg-gray-200 py-1.5 px-4 text-sm">
              Найти
            </button>
          </div>

          {/* Recently Visited (Horizontal Scroll) */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 px-1">
              Недавно посещали
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {communities.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl shadow-sm group-hover:shadow-md transition-all border-2 border-white">
                    {c.image}
                  </div>
                  <span className="text-xs text-center text-gray-600 truncate w-20 group-hover:text-indigo-600">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Communities List */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">
                Все сообщества{" "}
                <span className="text-gray-400 font-normal ml-1">
                  {communities.length}
                </span>
              </h2>
              <div className="flex gap-2 text-sm">
                <button className="text-indigo-600 font-medium">
                  Популярные
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-gray-500 hover:text-gray-700">
                  Новые
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {communities.map((community) => (
                <div
                  key={community.id}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl shrink-0">
                    {community.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {community.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {community.desc}
                    </p>
                    <div className="text-xs text-gray-400 mt-1">
                      {community.members.toLocaleString()} участников
                    </div>
                  </div>
                  <button className="btn bg-gray-100 text-indigo-600 hover:bg-indigo-100 py-1.5 px-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Вступить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-4">
          <button className="btn btn-primary w-full py-2.5 shadow-lg shadow-indigo-200">
            + Создать сообщество
          </button>

          <div className="card p-2">
            <div className="flex flex-col">
              <button className="flex items-center justify-between px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium text-sm">
                <span>Главная</span>
              </button>
              <button className="flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                <span>Управление</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                  2
                </span>
              </button>
              <button className="flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors">
                <span>Мероприятия</span>
              </button>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">
              Популярное
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      Top Group {i}
                    </div>
                    <div className="text-xs text-gray-400">100K subs</div>
                  </div>
                  <button className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
