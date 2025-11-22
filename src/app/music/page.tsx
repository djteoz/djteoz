import { prisma } from "../../lib/db";
import MusicClient from "./music-client";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const tracks = await prisma.music.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploader: {
        select: { username: true },
      },
    },
  });

  return (
    <main className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          Музыка
        </h1>
        <p className="text-gray-600">Слушайте и делитесь любимыми треками</p>
      </div>

      <MusicClient initialTracks={tracks} />
    </main>
  );
}
