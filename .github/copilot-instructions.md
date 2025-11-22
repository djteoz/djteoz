# Инструкции Copilot для Sudogram (2025)

## 🏗 Архитектура и Стек

- **Ядро**: Next.js 16.0.3 (App Router) + TypeScript + Tailwind CSS 4.
- **Данные**: Prisma 5 + PostgreSQL (Vercel). Все API используют Prisma через `src/lib/db.ts`.
- **Аутентификация**: JWT (Access 15мин/Refresh 30дней) в httpOnly cookies. Функции в `src/lib/jwt.ts`.
- **Состояние**: Polling для реального времени (Сообщения: 5с, Уведомления: 10с).
- **Автентификация запросов**: `FetchInterceptor` компонент в `src/components/` автоматически добавляет `Authorization: Bearer {token}` ко всем fetch запросам.

## 🚧 КРИТИЧЕСКИЕ Рабочие процессы

### Импорты (САМОЕ ВАЖНОЕ - ноябрь 2025)

На сервере сборки (Vercel Linux) **алиасы `@/` НЕ РАБОТАЮТ** для файлов, импортируемых из разных папок.

- **ИСПОЛЬЗУЙТЕ ОТНОСИТЕЛЬНЫЕ ПУТИ** для Prisma и JWT:
  - `src/app/api/**/route.ts` → `import { prisma } from "../../../../lib/db";`
  - `src/app/[page]/page.tsx` → `import { prisma } from "../../lib/db";`
  - `src/app/api/**/route.ts` → `import { verifyAccessToken } from "../../../../lib/jwt";`
- Алиасы `@/lib/jwt` и `@/lib/db` **ДОЛЖНЫ БЫЛ быть заменены относительными путями везде** (это финальное решение проблемы разрешения модулей).

### Динамические маршруты

Next.js 16 **требует `await` для `params`**:

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ← ОБЯЗАТЕЛЬНО await!
}
```

### Сборка

- Локальная сборка: `npm run build` - может работать с алиасами, но **проверяйте с относительными путями перед пушем**.
- На сервере: Turbopack иногда пропускает модули; если ошибка разрешения, пересоберите локально с полными относительными путями.

## 🔄 Паттерны API и Данных

### Prisma

- Инициализируется в `src/lib/db.ts` с глобальным кэшем для dev режима.
- **Всегда используйте `prisma.model.findMany()`, `findUnique()`, `create()`, `update()`, `delete()`**.
- Exemplo: `const user = await prisma.user.findUnique({ where: { username } });`
- **Все основные модели в schema**: User, Post, Comment, Message, Notification, Story, Bookmark, Report, Music, Video.

### Аутентификация в API

```typescript
import { cookies } from "next/headers";
import { verifyAccessToken } from "../../../../lib/jwt"; // ← относительный путь!

const cookieStore = await cookies();
let token = cookieStore.get("token")?.value;
if (!token && req.headers.get("authorization")) {
  token = req.headers.get("authorization")!.substring(7); // "Bearer {token}"
}
const payload = verifyAccessToken(token) as { username: string };
```

### Компоненты и Providers

- **`FetchInterceptor`** (`src/components/FetchInterceptor.tsx`): client-side компонент, перехватывает `window.fetch`, добавляет Authorization header.
- **`TokenRefreshProvider`**: Периодически обновляет access token через `/api/refresh`.
- **`ToastProvider`**: UI для уведомлений.
- Все они подключены в `src/app/layout.tsx`.

## 📂 Структура проекта

- `/src/app/api/*`: API Route Handlers. Файлы: `route.ts` для простых, `[param]/route.ts` для динамических.
- `/src/lib/db.ts`: Prisma Client (переименован с `prisma.ts` в Nov 2025).
- `/src/lib/jwt.ts`: JWT функции (sign/verify).
- `/src/components/`: React компоненты (FetchInterceptor, UserAvatar, Post, etc).
- `/src/app/[page]/page.tsx`: Страницы приложения.
- `/prisma/schema.prisma`: Схема БД и миграции.

## 📊 Текущий статус (Ноябрь 2025)

- **Активно**: Login, Register, Profile, Friends, Posts (Feed/Detail), Messages (Basic), Notifications, Stories, Recommendations.
- **Миграция Prisma**: Завершена. Все API используют `src/lib/db.ts`.
- **Известная проблема**: Дублирующиеся динамические маршруты (`[userId]` vs `[username]`) вызывают сбои. Используйте уникальные имена параметров.
- **Исправлено**: Ошибки разрешения модулей (`Cannot find module '@/lib/...'`) теперь решаются **относительными импортами**, а не алиасами.
