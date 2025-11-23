const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const username = "Alexander";
  console.log(`Checking user: ${username}...`);

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.log(`❌ User '${username}' not found! Please register first.`);
      return;
    }

    console.log(`User found. Current role: ${user.role || "USER"}`);

    if (user.role !== "ADMIN") {
      console.log(`Promoting '${username}' to ADMIN...`);
      const updated = await prisma.user.update({
        where: { username },
        data: { role: "ADMIN" },
      });
      console.log(`✅ Success! New role: ${updated.role}`);
    } else {
      console.log(`✅ User is already ADMIN.`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
