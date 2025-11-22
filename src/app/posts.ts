// In-memory база постов (заменить на реальную БД в проде)
export interface Post {
  id: string;
  author: string; // username
  text: string;
  image?: string;
  likes: string[]; // Массив юзернеймов, кто лайкнул
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string; // username
  text: string;
  createdAt: string;
}

export const posts: Record<string, Post> = {};

// Инициализация с примерами постов
export function initializeSamplePosts() {
  const now = new Date();
  const post1Date = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 часа назад
  const post2Date = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(); // 1 час назад
  const post3Date = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 30 минут назад

  posts["post_1"] = {
    id: "post_1",
    author: "ivan",
    text: "Отличный день для прогулки! 🌞 Погода просто супер в Питере!",
    likes: ["testuser", "maria"],
    comments: [
      {
        id: "comment_1",
        author: "maria",
        text: "Согласна! У нас тоже хорошая погода 😊",
        createdAt: post1Date,
      },
    ],
    createdAt: post1Date,
  };

  posts["post_2"] = {
    id: "post_2",
    author: "maria",
    text: "Закончил новый проект! 💻 Очень доволен результатом. Спасибо всем кто помогал!",
    likes: ["testuser", "ivan", "alex"],
    comments: [
      {
        id: "comment_2",
        author: "alex",
        text: "Поздравляю! Могу помочь с дизайном?",
        createdAt: post2Date,
      },
    ],
    createdAt: post2Date,
  };

  posts["post_3"] = {
    id: "post_3",
    author: "testuser",
    text: "Приглашаю всех на встречу разработчиков в этот вторник! Будем обсуждать новые технологии 🚀",
    likes: [],
    comments: [],
    createdAt: post3Date,
  };
}
