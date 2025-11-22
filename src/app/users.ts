// Общая in-memory база пользователей для API-роутов (заменить на реальную БД в проде)
export const users: Record<
  string,
  {
    password: string;
    avatar?: string;
    bio?: string;
    email?: string;
    createdAt: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    gender?: "male" | "female" | "other";
    birthday?: string;
    city?: string;
    country?: string;
    website?: string;
    interests?: string;
    isPublic?: boolean;
    friends?: string[]; // Список юзернеймов друзей
  }
> = {
  // Тестовые пользователи
  testuser: {
    password: "123456",
    email: "test@example.com",
    firstName: "Тест",
    lastName: "Пользователь",
    city: "Москва",
    country: "Россия",
    bio: "Тестовый пользователь",
    interests: "путешествия, программирование",
    createdAt: new Date().toISOString(),
    friends: ["ivan", "maria"],
  },
  ivan: {
    password: "password123",
    email: "ivan@example.com",
    firstName: "Иван",
    lastName: "Петров",
    city: "Санкт-Петербург",
    country: "Россия",
    bio: "Люблю путешествовать",
    interests: "путешествия, фотография",
    createdAt: new Date().toISOString(),
    friends: ["testuser", "maria"],
  },
  maria: {
    password: "pass1234",
    email: "maria@example.com",
    firstName: "Мария",
    lastName: "Соколова",
    city: "Казань",
    country: "Россия",
    bio: "Разработчик",
    interests: "программирование, веб",
    createdAt: new Date().toISOString(),
    friends: ["testuser", "ivan"],
  },
  alex: {
    password: "alex2024",
    email: "alex@example.com",
    firstName: "Александр",
    lastName: "Иванов",
    city: "Екатеринбург",
    country: "Россия",
    bio: "Designer & Developer",
    interests: "дизайн, технологии",
    createdAt: new Date().toISOString(),
    friends: [],
  },
};
