import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Help Center data...");

  // 1. Create Categories
  const categories = [
    {
      name: "Аккаунт",
      slug: "account",
      icon: "👤",
      description: "Настройки профиля, вход и безопасность",
      order: 1,
    },
    {
      name: "Безопасность",
      slug: "security",
      icon: "🔒",
      description: "Защита данных, двухфакторная аутентификация",
      order: 2,
    },
    {
      name: "Сообщества",
      slug: "communities",
      icon: "👥",
      description: "Создание и управление группами",
      order: 3,
    },
    {
      name: "Приватность",
      slug: "privacy",
      icon: "👁️",
      description: "Кто видит ваш контент",
      order: 4,
    },
    {
      name: "Платежи",
      slug: "payments",
      icon: "💳",
      description: "Подписки и возвраты",
      order: 5,
    },
    {
      name: "Другое",
      slug: "other",
      icon: "❓",
      description: "Общие вопросы",
      order: 6,
    },
  ];

  for (const cat of categories) {
    await prisma.helpCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 2. Create Articles
  const accountCat = await prisma.helpCategory.findUnique({
    where: { slug: "account" },
  });
  const securityCat = await prisma.helpCategory.findUnique({
    where: { slug: "security" },
  });
  const privacyCat = await prisma.helpCategory.findUnique({
    where: { slug: "privacy" },
  });

  if (accountCat) {
    await prisma.helpArticle.upsert({
      where: { slug: "how-to-change-password" },
      update: {},
      create: {
        title: "Как изменить пароль?",
        slug: "how-to-change-password",
        categoryId: accountCat.id,
        excerpt: "Пошаговая инструкция по смене пароля вашего аккаунта.",
        content: `
          <h2>Смена пароля</h2>
          <p>Чтобы изменить пароль, выполните следующие действия:</p>
          <ol>
            <li>Перейдите в <strong>Настройки</strong>.</li>
            <li>Выберите раздел <strong>Безопасность</strong>.</li>
            <li>Нажмите на кнопку <strong>Изменить пароль</strong>.</li>
            <li>Введите текущий пароль, а затем дважды новый пароль.</li>
          </ol>
          <p>Если вы забыли текущий пароль, воспользуйтесь функцией восстановления при входе.</p>
        `,
      },
    });

    await prisma.helpArticle.upsert({
      where: { slug: "delete-account" },
      update: {},
      create: {
        title: "Как удалить аккаунт?",
        slug: "delete-account",
        categoryId: accountCat.id,
        excerpt: "Информация о процедуре удаления аккаунта.",
        content: `
          <h2>Удаление аккаунта</h2>
          <p>Мы сожалеем, что вы решили уйти. Чтобы удалить аккаунт:</p>
          <ol>
            <li>Зайдите в <strong>Настройки</strong> -> <strong>Аккаунт</strong>.</li>
            <li>Прокрутите вниз до зоны опасности.</li>
            <li>Нажмите <strong>Удалить аккаунт</strong> и подтвердите действие.</li>
          </ol>
          <p>Обратите внимание: у вас будет 30 дней на восстановление аккаунта, после чего данные будут удалены безвозвратно.</p>
        `,
      },
    });
  }

  if (securityCat) {
    await prisma.helpArticle.upsert({
      where: { slug: "2fa-setup" },
      update: {},
      create: {
        title: "Настройка двухфакторной аутентификации (2FA)",
        slug: "2fa-setup",
        categoryId: securityCat.id,
        excerpt:
          "Защитите свой аккаунт с помощью дополнительного уровня безопасности.",
        content: `
          <h2>Что такое 2FA?</h2>
          <p>Двухфакторная аутентификация добавляет второй шаг проверки при входе в систему.</p>
          <h3>Как включить?</h3>
          <p>В данный момент эта функция находится в разработке и скоро появится в разделе Безопасность.</p>
        `,
      },
    });
  }

  if (privacyCat) {
    await prisma.helpArticle.upsert({
      where: { slug: "profile-visibility" },
      update: {},
      create: {
        title: "Кто видит мой профиль?",
        slug: "profile-visibility",
        categoryId: privacyCat.id,
        excerpt: "Настройка видимости вашей страницы для других пользователей.",
        content: `
          <h2>Настройки приватности</h2>
          <p>Вы можете выбрать, кто видит вашу информацию:</p>
          <ul>
            <li><strong>Все</strong>: Ваш профиль виден всем пользователям интернета.</li>
            <li><strong>Только друзья</strong>: Только подтвержденные друзья видят контент.</li>
            <li><strong>Только я</strong>: Профиль скрыт от всех.</li>
          </ul>
          <p>Изменить это можно в разделе <strong>Настройки</strong> -> <strong>Приватность</strong>.</p>
        `,
      },
    });
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
