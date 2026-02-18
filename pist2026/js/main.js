document.addEventListener('DOMContentLoaded', async () => {
    // 1. Завантаження та застосування налаштувань
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {
        theme: 'light', 
        size: '18px', 
        width: '95%', 
        fontFamily: '-apple-system, sans-serif'
    };
    applySettings(s);

    // 2. Підключення спільних компонентів
    await includeComponent('header', 'header');
    await includeComponent('toolbar', 'toolbar');
    await includeComponent('footer', 'footer');

    const type = document.body.dataset.pageType;
    
    if (type && type !== 'index') {
        // Якщо ми на сторінці списку — завантажуємо дані
        loadListData(type);
    } else if (type === 'index') {
        // Якщо на ГОЛОВНІЙ — прогріваємо кеш через 1 секунду
        console.log("Запуск фонового прогріву кешу...");
        setTimeout(() => {
            prefetchData('health');
            prefetchData('repose');
        }, 1000);
    }
});

// Функція фонового завантаження (тихо, без оновлення UI)
async function prefetchData(type) {
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
        const p = JSON.parse(cached);
        if (Date.now() - p.time < 300000) return; // Кеш ще свіжий
    }

    try {
        const res = await fetch(`${API_URL}?type=${type}`);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
        console.log(`Кеш для ${type} прогріто.`);
    } catch (e) {
        console.warn("Фоновий запит не вдався");
    }
}

async function loadListData(type, force = false) {
    const statusEl = document.getElementById('statusMsg');
    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    
    // Якщо дані є в кеші — миттєво рендеримо
    if (!force && cached) {
        const p = JSON.parse(cached);
        if (Date.now() - p.time < 300000) {
            return render(p.data);
        }
    }

    if (statusEl) statusEl.innerText = "Оновлення...";

    try {
        const res = await fetch(`${API_URL}?type=${type}${force ? '&t='+Date.now() : ''}`);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
        render(data);
    } catch (e) { 
        if (statusEl) statusEl.innerText = "Помилка зв'язку"; 
        console.error("Помилка завантаження:", e);
    }
}

function render(data) {
    const list = document.getElementById('nameList');
    const status = document.getElementById('statusMsg');

    if (!list || !status) return; 

    status.innerHTML = `Всього: ${data.count} <span onclick="loadListData(document.body.dataset.pageType, true)" style="cursor:pointer; margin-left:8px">🔄</span>`;
    
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
        if (!res.ok) throw new Error();
        el.innerHTML = await res.text();
        
        // Після завантаження тулбару синхронізуємо його стан
        if(name === 'toolbar') {
            const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%'};
            const themeSelect = document.getElementById('themeSelect');
            if(themeSelect) themeSelect.value = s.theme;
        }
    } catch (e) { 
        console.error('Компонент не знайдено:', name); 
    }
}

function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.style.setProperty('--font-size', s.size);
    document.documentElement.style.setProperty('--font-family', s.fontFamily || '-apple-system, sans-serif');
    
    const cleanWidth = parseInt(s.width) || 95;
    document.documentElement.style.setProperty('--width', cleanWidth + '%');

    // Оновлення цифр у модалці
    const fVal = document.getElementById('fontVal');
    const wVal = document.getElementById('widthVal');
    if (fVal) fVal.innerText = parseInt(s.size);
    if (wVal) wVal.innerText = cleanWidth;
}

window.updateSetting = (key, val) => {
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {
        theme: 'light', size: '18px', width: '95%', fontFamily: '-apple-system, sans-serif'
    };
    s[key] = val;
    localStorage.setItem('p2026_settings', JSON.stringify(s));
    applySettings(s);
};

window.toggleModal = (show) => {
    const modal = document.getElementById('settingsModal');
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