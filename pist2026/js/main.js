/**
 * ГЛОБАЛЬНІ ФУНКЦІЇ
 */

// Режим читання
window.toggleReadingMode = function() {
    console.log("Reading mode toggled"); // Для діагностики в Chrome
    document.body.classList.toggle('reading-mode');
    
    if (window.toggleModal) window.toggleModal(false);

    // 1. Кнопка виходу
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

    // 2. Лінія-закладка
    let line = document.getElementById('readingLine');
    if (!line) {
        line = document.createElement('div');
        line.id = 'readingLine';
        line.style.top = '50%';
        document.body.appendChild(line);
        initLineDrag(line);
    }
};

window.updateSetting = function(key, val) {
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {
        theme: 'light', size: '18px', width: '95%', fontFamily: '-apple-system, sans-serif'
    };
    s[key] = val;
    localStorage.setItem('p2026_settings', JSON.stringify(s));
    applySettings(s);
};

window.toggleModal = function(show) {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    if (show) {
        const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%'};
        if(document.getElementById('fontSizeRange')) document.getElementById('fontSizeRange').value = parseInt(s.size);
        if(document.getElementById('widthRange')) document.getElementById('widthRange').value = parseInt(s.width);
        if(document.getElementById('themeSelect')) document.getElementById('themeSelect').value = s.theme;
        if(document.getElementById('fontTypeSelect')) document.getElementById('fontTypeSelect').value = s.fontFamily || '-apple-system, sans-serif';
        applySettings(s);
    }
    modal.classList.toggle('active', show);
};

/**
 * ЛОГІКА ПЕРЕТЯГУВАННЯ
 */
function initLineDrag(line) {
    let isDragging = false;

    const moveLine = (e) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        const y = e.touches ? e.touches[0].clientY : e.clientY;
        const minY = 10, maxY = window.innerHeight - 10;
        const constrainedY = Math.max(minY, Math.min(y, maxY));
        
        line.style.top = `${constrainedY}px`;
    };

    const startDrag = (e) => {
        isDragging = true;
        line.style.opacity = "0.8";
        document.body.classList.add('is-dragging-line');
    };

    const stopDrag = () => {
        isDragging = false;
        line.style.opacity = "0.5";
        document.body.classList.remove('is-dragging-line');
    };

    line.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(); });
    window.addEventListener('mousemove', moveLine, { passive: false });
    window.addEventListener('mouseup', stopDrag);

    line.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); startDrag(); }, { passive: false });
    window.addEventListener('touchmove', moveLine, { passive: false });
    window.addEventListener('touchend', stopDrag);
}

/**
 * ЗАВАНТАЖЕННЯ ТА КОМПОНЕНТИ
 */

document.addEventListener('DOMContentLoaded', async () => {
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {
        theme: 'light', size: '18px', width: '95%', fontFamily: '-apple-system, sans-serif'
    };
    applySettings(s);

    await includeComponent('header', 'header');
    await includeComponent('toolbar', 'toolbar');
    await includeComponent('footer', 'footer');

    const type = document.body.dataset.pageType;
    if (type && type !== 'index') {
        loadListData(type);
    } else if (type === 'index') {
        setTimeout(() => { prefetchData('health'); prefetchData('repose'); }, 1000);
    }
});

async function includeComponent(id, name) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const isSubFolder = window.location.pathname.includes('/za-zdorovya/') || window.location.pathname.includes('/za-spokiy/');
    const prefix = isSubFolder ? '../components/' : 'components/';
    
    try {
        const res = await fetch(`${prefix}${name}.html`);
        if (!res.ok) throw new Error();
        el.innerHTML = await res.text();
        
        // ВИПРАВЛЕННЯ ДЛЯ CHROME: Примусова прив'язка подій
        if(name === 'toolbar') {
            const readBtn = el.querySelector('button[onclick*="toggleReadingMode"]');
            if (readBtn) {
                readBtn.onclick = function(e) {
                    e.preventDefault();
                    window.toggleReadingMode();
                };
            }
            const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%'};
            const themeSelect = document.getElementById('themeSelect');
            if(themeSelect) themeSelect.value = s.theme;
        }
    } catch (e) { console.error('Помилка компонента:', name); }
}

async function prefetchData(type) {
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && (Date.now() - JSON.parse(cached).time < 300000)) return;

    try {
        const res = await fetch(`${API_URL}?type=${type}`);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
    } catch (e) {}
}

async function loadListData(type, force = false) {
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
}

function render(data) {
    const list = document.getElementById('nameList');
    const status = document.getElementById('statusMsg');
    if (!list || !status) return; 

    status.innerHTML = `Всього: ${data.count} <span onclick="loadListData(document.body.dataset.pageType, true)" style="cursor:pointer; margin-left:8px">🔄</span>`;
    list.innerHTML = data.items && data.items.length > 0 
        ? data.items.map(i => `<div class="name-item">${i}</div>`).join('')
        : `<div style="text-align:center; padding:20px; opacity:0.5">Список порожній</div>`;
}

function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.style.setProperty('--font-size', s.size);
    document.documentElement.style.setProperty('--font-family', s.fontFamily || '-apple-system, sans-serif');
    const cleanWidth = parseInt(s.width) || 95;
    document.documentElement.style.setProperty('--width', cleanWidth + '%');
    const fVal = document.getElementById('fontVal'), wVal = document.getElementById('widthVal');
    if (fVal) fVal.innerText = parseInt(s.size);
    if (wVal) wVal.innerText = cleanWidth;
}