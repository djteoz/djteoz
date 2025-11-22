import { prisma } from "../../lib/db";
import VideoClient from "./video-client";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploader: {
        select: { username: true },
      },
    },
  });

  return (
    <main className="max-w-6xl mx-auto p-6 pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">
          Видео
        </h1>
        <p className="text-gray-600">Смотрите и загружайте видео</p>
      </div>

      <VideoClient initialVideos={videos} />
    </main>
  );
}
