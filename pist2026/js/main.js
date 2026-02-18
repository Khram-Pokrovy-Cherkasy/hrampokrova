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
    console.log("Reading mode active");
    document.body.classList.toggle('reading-mode');
    
    // Закриваємо модалку через window
    window.toggleModal(false);

    // Кнопка виходу
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
    let line = document.getElementById('readingLine');
    if (!line) {
        line = document.createElement('div');
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

window.prefetchData = async function(type) {
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && (Date.now() - JSON.parse(cached).time < 300000)) return;
    try {
        const res = await fetch(`${API_URL}?type=${type}`);
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

function render(data) {
    const list = document.getElementById('nameList');
    const status = document.getElementById('statusMsg');
    if (!list || !status) return; 
    status.innerHTML = `Всього: ${data.count} <span onclick="window.loadListData(document.body.dataset.pageType, true)" style="cursor:pointer; margin-left:8px">🔄</span>`;
    list.innerHTML = data.items && data.items.length > 0 
        ? data.items.map(i => `<div class="name-item">${i}</div>`).join('')
        : `<div style="text-align:center; padding:20px; opacity:0.5">Список порожній</div>`;
}

async function includeComponent(id, name) {
    const el = document.getElementById(id);
    if (!el) return;
    const isSubFolder = window.location.pathname.includes('/za-zdorovya/') || window.location.pathname.includes('/za-spokiy/');
    const prefix = isSubFolder ? '../components/' : 'components/';
    try {
        const res = await fetch(`${prefix}${name}.html`);
        el.innerHTML = await res.text();
    } catch (e) { console.error('Error component:', name); }
}

function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.style.setProperty('--font-size', s.size);
    document.documentElement.style.setProperty('--font-family', s.fontFamily || '-apple-system, sans-serif');
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
    // Шукаємо найближчу кнопку або елемент з атрибутом onclick
    const target = e.target.closest('[onclick]');
    if (!target) return;

    const attr = target.getAttribute('onclick');
    
    if (attr.includes('toggleReadingMode()')) {
        e.preventDefault();
        window.toggleReadingMode();
    } else if (attr.includes('toggleModal(true)')) {
        e.preventDefault();
        window.toggleModal(true);
    } else if (attr.includes('toggleModal(false)')) {
        e.preventDefault();
        window.toggleModal(false);
    }
}, true);