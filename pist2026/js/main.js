document.addEventListener('DOMContentLoaded', async () => {
    // 1. Завантаження налаштувань
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%'};
    applySettings(s);

    // 2. Інклюд компонентів (працює всюди)
    await includeComponent('header', 'header');
    await includeComponent('toolbar', 'toolbar');
    await includeComponent('footer', 'footer');

    // 3. ЗАВАНТАЖЕННЯ ДАНИХ ТІЛЬКИ ЯКЩО МИ НА СТОРІНЦІ СПИСКУ
    const type = document.body.dataset.pageType;
    
    // ДОДАЙТЕ ЦЮ ПЕРЕВІРКУ:
    // Якщо ми на головній (index), нам не треба завантажувати списки імен
    if (type && type !== 'index') {
        loadListData(type);
    }
});

async function includeComponent(id, name) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Більш надійна перевірка: якщо ми НЕ в корені /pist2026/
    const isSubFolder = window.location.pathname.includes('/za-zdorovya/') || window.location.pathname.includes('/za-spokiy/');
    const prefix = isSubFolder ? '../components/' : 'components/';
    
    try {
        const res = await fetch(`${prefix}${name}.html`);
        if (!res.ok) throw new Error();
        el.innerHTML = await res.text();
        
        if(name === 'toolbar') {
            const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%'};
            const themeSelect = document.getElementById('themeSelect');
            if(themeSelect) themeSelect.value = s.theme;
        }
    } catch (e) { 
        console.error('Компонент не знайдено:', name); 
    }
}

async function loadListData(type, force = false) {
    const statusEl = document.getElementById('statusMsg');
    if (statusEl) statusEl.innerText = "Оновлення..."; // Показуємо статус тільки при старті завантаження

    const cacheKey = `data_${type}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!force && cached) {
        const p = JSON.parse(cached);
        if (Date.now() - p.time < 300000) return render(p.data);
    }

    try {
        const res = await fetch(`${API_URL}?type=${type}${force ? '&t='+Date.now() : ''}`);
        const data = await res.json();
        localStorage.setItem(cacheKey, JSON.stringify({time: Date.now(), data}));
        render(data);
    } catch (e) { 
        if (statusEl) statusEl.innerText = "Помилка оновлення"; 
        console.error("Помилка завантаження:", e);
    }
}

function render(data) {
    const list = document.getElementById('nameList');
    const status = document.getElementById('statusMsg');

    // Якщо елементів немає на сторінці — нічого не робимо
    if (!list || !status) return; 

    status.innerHTML = `Всього: ${data.count} <span onclick="loadListData(document.body.dataset.pageType, true)" style="cursor:pointer">🔄</span>`;
    list.innerHTML = data.items.map(i => `<div class="name-item">${i}</div>`).join('');
}

function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.style.setProperty('--font-size', s.size);
    
    // Чистимо значення від зайвих відсотків і додаємо один раз
    const cleanWidth = parseInt(s.width) || 95; 
    document.documentElement.style.setProperty('--width', cleanWidth + '%');
}

window.updateSetting = (key, val) => {
    const s = JSON.parse(localStorage.getItem('p2026_settings')) || {theme:'light', size:'18px', width:'95%'};
    
    // Якщо ми міняємо ширину, перевіряємо чи є там %
    if (key === 'width' && !val.includes('%')) val += '%';
    
    s[key] = val;
    localStorage.setItem('p2026_settings', JSON.stringify(s));
    applySettings(s);
};

window.toggleModal = (show) => {
    document.getElementById('settingsModal').classList.toggle('active', show);
};