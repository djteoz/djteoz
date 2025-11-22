"use client";

export default function HelpPage() {
  const faqItems = [
    {
      q: "Как создать аккаунт?",
      a: "Нажмите кнопку 'Регистрация' и заполните форму с логином, email и паролем. Пароль должен быть не менее 8 символов с большой и малой буквой, и цифрой.",
    },
    {
      q: "Как добавить друзей?",
      a: "Перейдите в раздел 'Друзья', найдите нужного пользователя через поиск и нажмите 'Добавить в друзья'.",
    },
    {
      q: "Как изменить профиль?",
      a: "Откройте ваш профиль (нажимая на аватар в Navbar), нажмите 'Редактировать профиль' и заполните нужные поля.",
    },
    {
      q: "Как загрузить аватар?",
      a: "В режиме редактирования профиля нажмите на иконку камеры на аватаре и выберите фото.",
    },
    {
      q: "Как отправить сообщение?",
      a: "Перейдите в Мессенджер и найдите пользователя через поиск, или откройте профиль и нажмите 'Отправить сообщение'.",
    },
    {
      q: "Как удалить аккаунт?",
      a: "Перейдите в Настройки → Опасные действия → Удалить аккаунт. Это действие необратимо.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Справка и FAQ</h1>
      <p className="text-gray-600 mb-8">
        Найдите ответы на частые вопросы о Sudogram
      </p>

      {/* FAQ Раздел */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Часто задаваемые вопросы
        </h2>
        <div className="space-y-6">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="border-b border-gray-200 pb-6 last:border-b-0"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {item.q}
              </h3>
              <p className="text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Контакты Поддержки */}
      <div className="bg-blue-50 rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Служба поддержки
        </h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <span className="font-semibold">Email:</span>{" "}
            <a
              href="mailto:support@sudogram.local"
              className="text-blue-600 hover:underline"
            >
              support@sudogram.local
            </a>
          </div>
          <div>
            <span className="font-semibold">Telegram:</span>{" "}
            <a
              href="https://t.me/sudogram_support"
              className="text-blue-600 hover:underline"
            >
              @sudogram_support
            </a>
          </div>
          <div>
            <span className="font-semibold">Рабочие часы:</span> 09:00 - 22:00
            (МСК)
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Обычно мы отвечаем в течение 2-4 часов
          </div>
        </div>
      </div>

      {/* Политики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="#"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            📋 Пользовательское соглашение
          </h3>
          <p className="text-gray-600 text-sm">
            Правила использования платформы Sudogram
          </p>
        </a>
        <a
          href="#"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            🔒 Политика конфиденциальности
          </h3>
          <p className="text-gray-600 text-sm">Как мы защищаем ваши данные</p>
        </a>
      </div>
    </div>
  );
}
