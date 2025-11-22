import React from "react";

async function getGame() {
  // Mock data
  return {
    title: "Space Shooter",
    description:
      "Защити галактику от вторжения инопланетных захватчиков. Улучшай свой корабль и побеждай боссов!",
    image: "🚀",
  };
}

export default async function GamePage() {
  const game = await getGame();
  if (!game) return <main className="p-4 text-center">Игра не найдена</main>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="card p-8 text-center">
        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-6xl shadow-lg mb-6">
          {game.image}
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{game.title}</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          {game.description}
        </p>

        <div className="flex justify-center gap-4">
          <button className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-indigo-200">
            Начать игру
          </button>
          <button className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg">
            Таблица лидеров
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-500">
        <p>Игровое окно будет загружено здесь...</p>
      </div>
    </main>
  );
}
