const CACHE_NAME = 'hram-v3'; // Нова версія для примусового оновлення

const ASSETS = [
  '/pist2026/',
  '/pist2026/index.html',
  // За здоров'я - обидва варіанти шляхів
  '/pist2026/za-zdorovya',
  '/pist2026/za-zdorovya/',
  '/pist2026/za-zdorovya/index.html',
  // За упокій - обидва варіанти шляхів
  '/pist2026/za-spokiy',
  '/pist2026/za-spokiy/',
  '/pist2026/za-spokiy/index.html',
  // Ресурси
  '/pist2026/css/style.css',
  '/pist2026/js/main.js',
  '/pist2026/components/header.html',
  '/pist2026/components/toolbar.html',
  '/pist2026/components/footer.html'
];

// Встановлення воркера та кешування
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Змушуємо новий воркер активуватися негайно
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Кешування ресурсів...');
      return cache.addAll(ASSETS);
    })
  );
});

// Очищення старих кешів (щоб не займали місце)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Видалення старого кешу:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Обробка запитів
self.addEventListener('fetch', (e) => {
  e.respondWith(
    // Спробувати отримати файл із мережі
    fetch(e.request).catch(() => {
      // Якщо мережі немає — шукаємо в кеші
      return caches.match(e.request).then((response) => {
        if (response) {
          return response;
        }

        // Якщо це перехід на сторінку (navigation), а її немає в кеші —
        // повертаємо головну як запасний варіант
        if (e.request.mode === 'navigate') {
          return caches.match('/pist2026/index.html');
        }

        // Якщо це картинка або інший ресурс — повертаємо просто помилку,
        // щоб не ламати логіку TypeError
        return new Response('Resource not found offline', {
          status: 404,
          statusText: 'Offline error'
        });
      });
    })
  );
});