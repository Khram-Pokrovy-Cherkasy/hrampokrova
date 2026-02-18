/**
 * ГЛОБАЛЬНІ ФУНКЦІЇ (Доступні всюди)
 */

// 1. Керування модальним вікном (Налаштування)
window.toggleModal = function(show) {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    if (show) {
        const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%'};
        // Синхронізуємо елементи форми з даними в пам'яті
        if(document.getElementById('fontSizeRange')) document.getElementById('fontSizeRange').value = parseInt(s.size);
        if(document.getElementById('widthRange')) document.getElementById('widthRange').value = parseInt(s.width);
        if(document.getElementById('themeSelect')) document.getElementById('themeSelect').value = s.theme;
        if(document.getElementById('fontTypeSelect')) document.getElementById('fontTypeSelect').value = s.fontFamily || '-apple-system, sans-serif';
        applySettings(s);
    }
    modal.classList.toggle('active', show);
};

// 2. Оновлення налаштувань користувача
window.updateSetting = function(key, val) {
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {
        theme: 'light', size: '18px', width: '95%', fontFamily: '-apple-system, sans-serif'
    };
    s[key] = val;
    localStorage.setItem('p2026_settings', JSON.stringify(s));
    applySettings(s);
};

// 3. Фонове завантаження (Prefetch)
window.prefetchData = async function(type) {
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && (Date.now() - JSON.parse(cached).time < 300000)) return;

    try {
        const res = await fetch(`${API_URL}?type=${type}`);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
        console.log(`Кеш для ${type} прогріто.`);
    } catch (e) { console.warn("Prefetch failed"); }
};

// 4. Режим читання
window.toggleReadingMode = function() {
    document.body.classList.toggle('reading-mode');
    if (window.toggleModal) window.toggleModal(false);

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

    let line = document.getElementById('readingLine');
    if (!line) {
        line = document.createElement('div');
        line.id = 'readingLine';
        line.style.top = '50%';
        document.body.appendChild(line);
        initLineDrag(line);
    }
};

// 5. Завантаження даних для списку імен
window.loadListData = async function(type, force = false) {
    const statusEl = document.getElementById('statusMsg');
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!force && cached) {
        const p = JSON.parse(cached);
        if (Date.now() - p.time < 300000) return render(p.data);
    }

    if (statusEl) statusEl.innerText = "Оновлення...";
    try {
        const res = await fetch(`${API_URL}?type=${type}${force ? '&t='+Date.now() : ''}`);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
        render(data);
    } catch (e) { if (statusEl) statusEl.innerText = "Помилка зв'язку"; }
};

/**
 * ДОПОМІЖНІ ФУНКЦІЇ (Внутрішні)
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

function render(data) {
    const list = document.getElementById('nameList');
    const status = document.getElementById('statusMsg');
    if (!list || !status) return; 

    status.innerHTML = `Всього: ${data.count} <span onclick="window.loadListData(document.body.dataset.pageType, true)" style="cursor:pointer; margin-left:8px" title="Оновити дані">🔄</span>`;
    list.innerHTML = data.items && data.items.length > 0 
        ? data.items.map(i => `<div class="name-item">${i}</div>`).join('')
        : `<div style="text-align:center; padding:20px; opacity:0.5">Список порожній</div>`;
}

/**
 * ОСНОВНИЙ ЦИКЛ (Ініціалізація)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Завантаження налаштувань
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || { theme: 'light', size: '18px', width: '95%' };
    applySettings(s);

    // 2. Вставка компонентів
    await includeComponent('header', 'header');
    await includeComponent('toolbar', 'toolbar');
    await includeComponent('footer', 'footer');

    // 3. Завантаження даних або прогрів кешу
    const type = document.body.dataset.pageType;
    if (type && type !== 'index') {
        window.loadListData(type);
    } else if (type === 'index') {
        setTimeout(() => { 
            window.prefetchData('health'); 
            window.prefetchData('repose'); 
        }, 1000);
    }
});

/**
 * СИСТЕМНІ ФУНКЦІЇ (Утиліти)
 */

async function includeComponent(id, name) {
    const el = document.getElementById(id);
    if (!el) return;
    const isSubFolder = window.location.pathname.includes('/za-zdorovya/') || window.location.pathname.includes('/za-spokiy/');
    const prefix = isSubFolder ? '../components/' : 'components/';
    try {
        const res = await fetch(`${prefix}${name}.html`);
        if (!res.ok) throw new Error();
        el.innerHTML = await res.text();
        
        // Спеціальна обробка для кнопок у тулбарі (Chrome Fix)
        if(name === 'toolbar') {
            const readBtn = el.querySelector('button[onclick*="toggleReadingMode"]');
            if (readBtn) {
                readBtn.onclick = function(e) { e.preventDefault(); window.toggleReadingMode(); };
            }
            // Синхронізація теми в селекті
            const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light'};
            const ts = document.getElementById('themeSelect');
            if(ts) ts.value = s.theme;
        }
    } catch (e) { console.error('Error loading component:', name); }
}

function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.style.setProperty('--font-size', s.size);
    document.documentElement.style.setProperty('--width', (parseInt(s.width) || 95) + '%');
    
    // Оновлення текстових індикаторів у модалці
    const fVal = document.getElementById('fontVal'), wVal = document.getElementById('widthVal');
    if (fVal) fVal.innerText = parseInt(s.size);
    if (wVal) wVal.innerText = parseInt(s.width);
}

/**
 * ДЕЛЕГУВАННЯ ПОДІЙ (Остання лінія оборони для Chrome)
 */
document.addEventListener('click', function (e) {
    const attr = e.target.getAttribute('onclick');
    if (attr && attr.includes('toggleReadingMode()')) {
        e.preventDefault();
        window.toggleReadingMode();
    }
    if (attr && attr.includes('toggleModal(true)')) {
        e.preventDefault();
        window.toggleModal(true);
    }
}, true);