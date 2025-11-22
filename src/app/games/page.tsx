import React from "react";
import Link from "next/link";

async function getGames() {
  // Mock data for now
  return [
    {
      id: 1,
      title: "Space Shooter",
      description: "Защити галактику от вторжения",
      image: "🚀",
    },
    {
      id: 2,
      title: "Farm Tycoon",
      description: "Построй ферму своей мечты",
      image: "🚜",
    },
    {
      id: 3,
      title: "Chess Master",
      description: "Классические шахматы онлайн",
      image: "♟️",
    },
    {
      id: 4,
      title: "Racing Pro",
      description: "Гонки на высоких скоростях",
      image: "🏎️",
    },
  ];
}

export default async function GamesPage() {
  const games = await getGames();

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          Игры
        </h1>
        <p className="text-gray-600 mt-1">Играйте с друзьями онлайн</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {games.map((game: any) => (
          <Link
            key={game.id}
            href={`/game?id=${game.id}`}
            className="card p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 h-full flex flex-col"
          >
            <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
              {game.image}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                {game.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                {game.description}
              </p>
              <button className="btn btn-primary w-full py-2 text-sm">
                Играть
              </button>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
