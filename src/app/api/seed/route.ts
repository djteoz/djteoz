import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { signAccessToken } from "../../../lib/jwt";

export async function GET() {
  try {
    // 1. Create Test User (Admin of the community)
    const adminUser = await prisma.user.upsert({
      where: { username: "community_admin" },
      update: {},
      create: {
        username: "community_admin",
        email: "admin@community.com",
        password: "password123", // In real app, hash this!
        firstName: "Community",
        lastName: "Admin",
        bio: "I manage communities",
        avatar: "default-avatar.png",
      },
    });

    // 2. Create Test Members
    const member1 = await prisma.user.upsert({
      where: { username: "gamer_one" },
      update: {},
      create: {
        username: "gamer_one",
        email: "gamer1@test.com",
        password: "password123",
        firstName: "Gamer",
        lastName: "One",
      },
    });

    // 3. Create Communities
    const gameCommunity = await prisma.community.create({
      data: {
        name: "Game Developers",
        slug: "gamedev",
        description:
          "Сообщество разработчиков игр. Обсуждаем Unity, UE5, Godot и геймдизайн.",
        type: "public",
        category: "Games",
        cover: null,
        avatar: null,
        members: {
          create: [
            { userId: adminUser.id, role: "OWNER" },
            { userId: member1.id, role: "MEMBER" },
          ],
        },
        membersCount: 2,
      },
    });

    const musicCommunity = await prisma.community.create({
      data: {
        name: "Music Lovers 2025",
        slug: "music2025",
        description: "Делимся новинками музыки и обсуждаем концерты.",
        type: "public",
        category: "Music",
        members: {
          create: [{ userId: adminUser.id, role: "ADMIN" }],
        },
        membersCount: 1,
      },
    });

    // 4. Create some posts in the community
    await prisma.post.create({
      data: {
        content:
          "Всем привет! Это первый пост в сообществе разработчиков игр. Кто какой движок использует?",
        authorId: adminUser.id,
        communityId: gameCommunity.id,
      },
    });

    await prisma.post.create({
      data: {
        content: "Unity 6 вышел! Кто уже пробовал?",
        authorId: member1.id,
        communityId: gameCommunity.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Seed data created successfully",
      communities: [gameCommunity.name, musicCommunity.name],
      adminUser: adminUser.username,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed data", details: String(error) },
      { status: 500 }
    );
  }
}
