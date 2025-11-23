const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding communities...");

  // 1. Create Test User (Admin)
  const adminUser = await prisma.user.upsert({
    where: { username: "community_admin" },
    update: {},
    create: {
      username: "community_admin",
      email: "admin@community.com",
      password: "password123",
      firstName: "Community",
      lastName: "Admin",
      bio: "I manage communities",
      avatar: null,
    },
  });
  console.log("Created user:", adminUser.username);

  // 2. Create Test Member
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
  console.log("Created user:", member1.username);

  // 3. Create Communities
  // Check if exists first to avoid unique constraint error on slug
  const existing = await prisma.community.findUnique({
    where: { slug: "gamedev" },
  });

  let gameCommunity;
  if (!existing) {
    gameCommunity = await prisma.community.create({
      data: {
        name: "Game Developers",
        slug: "gamedev",
        description:
          "Сообщество разработчиков игр. Обсуждаем Unity, UE5, Godot и геймдизайн.",
        type: "public",
        category: "Games",
        members: {
          create: [
            { userId: adminUser.id, role: "OWNER" },
            { userId: member1.id, role: "MEMBER" },
          ],
        },
        membersCount: 2,
      },
    });
    console.log("Created community:", gameCommunity.name);
  } else {
    gameCommunity = existing;
    console.log("Community already exists:", existing.name);
  }

  // 4. Create Posts
  await prisma.post.create({
    data: {
      content:
        "Всем привет! Это первый пост в сообществе разработчиков игр. Кто какой движок использует?",
      authorId: adminUser.id,
      communityId: gameCommunity.id,
    },
  });
  console.log("Created posts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
