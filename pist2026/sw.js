const CACHE_NAME = 'hram-v1';
const ASSETS = [
  '/pist2026/', // Коренева сторінка папки
  '/pist2026/index.html',
  '/pist2026/za-zdorovya/index.html',
  '/pist2026/za-spokiy/index.html',
  '/pist2026/css/style.css',
  '/pist2026/js/main.js',
  '/pist2026/components/header.html',
  '/pist2026/components/toolbar.html',
  '/pist2026/components/footer.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});