if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/pist2026/sw.js', { scope: '/pist2026/' })
            .then(reg => {
                console.log('SW зареєстровано');
                // НОВЕ: Перевіряємо оновлення при кожному завантаженні
                reg.update(); 
            })
            .catch(err => console.log('Помилка SW:', err));
    });
}

/**
 * ГЛОБАЛЬНІ ФУНКЦІЇ
 */

window.toggleModal = function(show) {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    if (show) {
        const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%', fontFamily: '-apple-system, sans-serif'};
        if(document.getElementById('fontSizeRange')) document.getElementById('fontSizeRange').value = parseInt(s.size);
        if(document.getElementById('widthRange')) document.getElementById('widthRange').value = parseInt(s.width);
        if(document.getElementById('themeSelect')) document.getElementById('themeSelect').value = s.theme;
        if(document.getElementById('fontTypeSelect')) document.getElementById('fontTypeSelect').value = s.fontFamily;
        applySettings(s);

        // НОВЕ: Закриваємо при кліку на фон (оверлей), але не на контент
        modal.onclick = function(e) {
            if (e.target === modal) {
                window.toggleModal(false);
            }
        };
    }
    modal.classList.toggle('active', show);
};

window.updateSetting = function(key, val) {
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {
        theme: 'light', size: '18px', width: '95%', fontFamily: '-apple-system, sans-serif'
    };
    s[key] = val;
    localStorage.setItem('p2026_settings', JSON.stringify(s));
    applySettings(s);
};

window.toggleReadingMode = function() {
    // Якщо клас вже є, нічого не робимо (або виходимо), 
    // але краще просто залишити toggle, якщо ми прибрали подвійний виклик.
    if (document.body.classList.contains('reading-mode')) {
        console.log("Reading mode already active");
        return; 
    }
    
    document.body.classList.add('reading-mode');
    window.toggleModal(false);

    // Створення кнопки виходу (якщо немає)
    if (!document.getElementById('exitReading')) {
        const btn = document.createElement('button');
        btn.id = 'exitReading';
        btn.innerText = 'Вийти з режиму читання ✕';
        btn.onclick = function() {
            document.body.classList.remove('reading-mode');
            this.remove();
        };
        document.body.appendChild(btn);
    }

    // Лінія-закладка
    if (!document.getElementById('readingLine')) {
        const line = document.createElement('div');
        line.id = 'readingLine';
        line.style.top = '50%';
        document.body.appendChild(line);
        initLineDrag(line);
    }
};

window.loadListData = async function(type, force = false) {
    const statusEl = document.getElementById('statusMsg');
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    
    // Перевіряємо наявність кешу перед запитом
    let cachedData = null;
    if (cached) {
        const p = JSON.parse(cached);
        cachedData = p.data;
        // Якщо кеш свіжий (менше 5 хв) і ми не тиснули "Оновити", показуємо відразу
        if (!force && (Date.now() - p.time < 300000)) {
            return render(cachedData);
        }
    }

    if (statusEl) statusEl.innerText = "Оновлення...";

    try {
        const res = await fetch(`${API_URL}?type=${type}${force ? '&t='+Date.now() : ''}`, {
            credentials: 'same-origin'
        });
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        
        // Зберігаємо нові дані
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
        render(data);
    } catch (e) { 
        console.error("API Unavailable:", e);
        if (statusEl) {
            // Якщо сервер впав, але у нас є хоч якийсь кеш — показуємо його
            if (cachedData) {
                // Викликаємо render, але передаємо true для параметра isOffline
                render(cachedData, true);
            } else {
                statusEl.innerText = "Помилка зв'язку (дані відсутні)";
            }
        }
    }
};

window.prefetchData = async function(type) {
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && (Date.now() - JSON.parse(cached).time < 300000)) return;
    try {
        const res = await fetch(`${API_URL}?type=${type}`, {
            credentials: 'same-origin'
        });
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
    } catch (e) {}
};

/**
 * ДОПОМІЖНІ ФУНКЦІЇ
 */

function initLineDrag(line) {
    let isDragging = false;
    const moveLine = (e) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        const minY = 10, maxY = window.innerHeight - 10;
        line.style.top = `${Math.max(minY, Math.min(y, maxY))}px`;
    };
    const startDrag = () => { isDragging = true; line.style.opacity = "0.8"; document.body.classList.add('is-dragging-line'); };
    const stopDrag = () => { isDragging = false; line.style.opacity = "0.5"; document.body.classList.remove('is-dragging-line'); };

    line.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(); });
    window.addEventListener('mousemove', moveLine, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    line.addEventListener('touchstart', (e) => { startDrag(); }, { passive: false });
    window.addEventListener('touchmove', moveLine, { passive: false });
    window.addEventListener('touchend', stopDrag);
}

function render(data, isOffline = false) {
    const list = document.getElementById('nameList');
    const status = document.getElementById('statusMsg');
    if (!list || !status) return; 

    const type = document.body.dataset.pageType;
    
    // Формуємо текст статусу залежно від режиму
    let statusText = isOffline ? `⚠️ Офлайн режим (архів)` : `Всього: ${data.count}`;
    
    status.innerHTML = `${statusText} <span onclick="window.loadListData('${type}', true)" style="cursor:pointer; margin-left:8px" title="Оновити дані">🔄</span>`;
    
    if (data.items && data.items.length > 0) {
        list.innerHTML = data.items.map(i => `<div class="name-item">${i}</div>`).join('');
    } else {
        list.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.5">Список порожній</div>`;
    }
}
async function includeComponent(id, name) {
    const el = document.getElementById(id);
    if (!el) return;
    const isSubFolder = window.location.pathname.includes('/za-zdorovya/') || window.location.pathname.includes('/za-spokiy/');
    const prefix = isSubFolder ? '../components/' : 'components/';
    try {
        const res = await fetch(`${prefix}${name}.html`);
        el.innerHTML = await res.text();
        
        // Залишаємо тільки синхронізацію теми
        if(name === 'toolbar') {
            const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light'};
            const ts = document.getElementById('themeSelect');
            if(ts) ts.value = s.theme;
        }
    } catch (e) { console.error('Error component:', name); }
}

function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.style.setProperty('--font-size', s.size);
    // Використовуємо лапки для назв шрифтів з пробілами
    const family = s.fontFamily.includes(',') ? s.fontFamily : `'${s.fontFamily}', sans-serif`;
    document.documentElement.style.setProperty('--font-family', family);
    document.documentElement.style.setProperty('--width', (parseInt(s.width) || 95) + '%');
    
    const fVal = document.getElementById('fontVal'), wVal = document.getElementById('widthVal');
    if (fVal) fVal.innerText = parseInt(s.size);
    if (wVal) wVal.innerText = parseInt(s.width);
}

/**
 * ІНІЦІАЛІЗАЦІЯ ТА ДЕЛЕГУВАННЯ
 */

document.addEventListener('DOMContentLoaded', async () => {
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || { theme: 'light', size: '18px', width: '95%', fontFamily: '-apple-system, sans-serif' };
    applySettings(s);

    await includeComponent('header', 'header');
    await includeComponent('toolbar', 'toolbar');
    await includeComponent('footer', 'footer');

    const type = document.body.dataset.pageType;
    if (type && type !== 'index') {
        window.loadListData(type);
    } else if (type === 'index') {
        setTimeout(() => { window.prefetchData('health'); window.prefetchData('repose'); }, 1000);
    }
});

// Глобальний слухач кліків (для Chrome та динамічного контенту)
document.addEventListener('click', function (e) {
    // 1. Якщо ми клікнули всередині .modal-content, нічого не робимо (це наші налаштування)
    if (e.target.closest('.modal-content')) {
        return; 
    }

    const target = e.target.closest('[onclick]');
    if (!target) return;

    const attr = target.getAttribute('onclick');
    
    // 2. Перевіряємо наші функції
    if (attr.includes('toggleReadingMode()')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        window.toggleReadingMode();
    } else if (attr.includes('toggleModal(true)')) {
        e.preventDefault();
        window.toggleModal(true);
    } else if (attr.includes('toggleModal(false)')) {
        e.preventDefault();
        window.toggleModal(false);
    }
}, true);