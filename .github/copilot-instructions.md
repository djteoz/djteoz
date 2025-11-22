# Инструкции Copilot для Sudogram (2025)

## 🏗 Архитектура и Стек

- **Ядро**: Next.js 16.0.3 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **База данных**: Prisma 5.22 + PostgreSQL. Prisma Client генерируется в `src/generated/prisma/`
- **Аутентификация**: 
  - JWT (Access 15мин/Refresh 30дней) через `src/lib/jwt.ts`
  - Access token в cookies (httpOnly: false) для доступа клиент+сервер
  - Refresh token в httpOnly cookies для безопасности
  - Client-side: token дублируется в localStorage для `FetchInterceptor`
- **Real-time**: Polling интервалы (Messages: 5с, Notifications: 10с) через `useTokenRefresh`
- **HTTP Interceptor**: `FetchInterceptor` автоматически добавляет `Authorization: Bearer {token}` ко всем fetch запросам

## 🚧 КРИТИЧЕСКИЕ Правила Разработки

### 1. Импорты (САМОЕ ВАЖНОЕ!)

**На Vercel Linux алиасы `@/` НЕ РАБОТАЮТ для server-side модулей!**

**ВСЕГДА используйте относительные пути для:**
```typescript
// ✅ ПРАВИЛЬНО для API routes
import { prisma } from "../../../lib/db";           // для /api/*/route.ts
import { verifyAccessToken } from "../../../lib/jwt"; 

import { prisma } from "../../../../lib/db";        // для /api/*/*/route.ts
import { verifyAccessToken } from "../../../../lib/jwt";

// ❌ НЕПРАВИЛЬНО - сломается на production
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
```

**Алиасы `@/` можно использовать ТОЛЬКО в:**
- Client Components (`"use client"`)
- Page Components (`src/app/*/page.tsx`)
- Shared Components (`src/components/`)

### 2. Динамические Маршруты (Next.js 16)

**Params теперь Promise!** Всегда используйте `await`:

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params; // ← ОБЯЗАТЕЛЬНО await!
}
```

### 3. Cookies API (Next.js 16)

**Функция `cookies()` теперь async:**

```typescript
const cookieStore = await cookies(); // ← ОБЯЗАТЕЛЬНО await!
const token = cookieStore.get("token")?.value;
```

## 🔄 Паттерны и Конвенции

### Аутентификация в API Routes

Стандартный паттерн для защищенных эндпоинтов:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";           // относительный путь!
import { verifyAccessToken } from "../../../lib/jwt"; // относительный путь!

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const payload = verifyAccessToken(token) as { username: string };
  const user = await prisma.user.findUnique({
    where: { username: payload.username }
  });
  
  // ... бизнес-логика
}
```

### Prisma Patterns

- **Инициализация**: `src/lib/db.ts` с singleton паттерном для dev
- **Client Path**: Генерируется в `src/generated/prisma/` (не в node_modules)
- **Модели**: User, Post, Comment, Message, Notification, Story, Bookmark, Report, Music, Video

**Типичные запросы:**
```typescript
// Поиск с include и фильтрацией
const posts = await prisma.post.findMany({
  where: { authorId: { in: friendIds } },
  include: {
    author: { select: { username: true, avatar: true } },
    comments: { take: 3, orderBy: { createdAt: "asc" } },
    _count: { select: { comments: true } }
  },
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * limit,
  take: limit
});

// Batch операции
await prisma.message.updateMany({
  where: { receiverId: userId, read: false },
  data: { read: true }
});
```

### Client-Side Authentication

**Ключевые компоненты** (все в `src/app/layout.tsx`):

1. **`FetchInterceptor`**: Перехватывает `window.fetch`, инжектит Bearer token из localStorage
2. **`TokenRefreshProvider`**: Каждые 5 минут обновляет access token через `/api/refresh`
3. **`ToastProvider`**: Глобальные уведомления

**Token Flow:**
```
1. Login → Server sets httpOnly cookies (token, refresh_token)
2. Client также сохраняет token в localStorage
3. FetchInterceptor читает token из localStorage для каждого fetch
4. TokenRefreshProvider периодически вызывает /api/refresh
5. При 401 → redirect на /login
```

## 📁 Структура Проекта

```
src/
├── app/
│   ├── api/              # API Route Handlers
│   │   ├── login/route.ts
│   │   ├── posts/route.ts
│   │   └── messages/[userId]/route.ts  # Динамические маршруты
│   ├── feed/page.tsx     # Страницы приложения
│   └── layout.tsx        # Root layout с Providers
├── components/           # React компоненты
│   ├── FetchInterceptor.tsx
│   └── TokenRefreshProvider.tsx
├── lib/                  # Утилиты
│   ├── db.ts            # Prisma Client instance
│   ├── jwt.ts           # JWT sign/verify functions
│   └── useTokenRefresh.ts
└── generated/prisma/     # Prisma generated client

prisma/
└── schema.prisma         # Database schema
```

## 🛠 Команды и Workflow

```bash
# Разработка
npm run dev              # Next.js dev server (порт 3000)

# Сборка (ВАЖНО: всегда проверяйте перед деплоем!)
npm run build            # Запускает prisma generate + next build
npm start                # Production server

# Prisma
npx prisma generate      # Генерирует client в src/generated/prisma/
npx prisma migrate dev   # Применяет миграции в dev
npx prisma studio        # GUI для БД

# Тестирование
npm run test             # Jest с jsdom environment
```

**Build Pipeline:**
1. `prisma generate` → создает клиент в `src/generated/prisma/`
2. `next build` → компилирует с Turbopack
3. Проверка: все относительные импорты для server modules

## 🐛 Известные Проблемы

- **Дублирующиеся параметры**: Используйте уникальные имена для динамических сегментов (`[userId]`, `[postId]`, НЕ оба `[id]`)
- **Turbopack module resolution**: Может пропускать модули в hot reload; при странных ошибках импорта → перезапустите dev server
- **Password hashing**: В `api/login/route.ts` используется plain text сравнение (TODO: bcrypt для production)
