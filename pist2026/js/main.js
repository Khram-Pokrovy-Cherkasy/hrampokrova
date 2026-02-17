// Зміна шрифту
let base = 100;
function fontStep(delta){
  base = Math.max(70, Math.min(180, base+delta));
  document.body.style.fontSize = base + '%';
}
function setFont(f){ document.body.style.setProperty('--font', f); }
function toggleTheme(){ document.body.classList.toggle('dark'); }

// Отримання даних з API
async function fetchData(type){
  const display = document.getElementById('data');
  display.innerText = "Завантаження…";
  try {
    const res = await fetch(`${API_BASE}?type=${type}`);
    if(!res.ok) throw new Error("Помилка сервера");
    const json = await res.json();
    display.innerHTML = json.rows.map(r=>r.text).join("<br>");
  } catch(e){
    display.innerText = "Не вдалось завантажити, спробуйте пізніше.";
    console.error(e);
  }
}

// Автовиклик на сторінці
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.body.dataset.type) fetchData(document.body.dataset.type);
});