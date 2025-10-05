/* ========================================
   CONFIGURATION - Konfigurasi API
   ======================================== */
const API_BASE = '../backend';

/* ========================================
   API FUNCTIONS - Fungsi untuk komunikasi dengan backend
   ======================================== */
async function api(path, options={}){
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)){
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}/${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });
  return res.json();
}

/* ========================================
   SESSION MANAGEMENT - Manajemen session user
   ======================================== */
async function getSession(){
  try{ return await api('auth_me.php'); }catch(e){ return { ok:false, user:null } }
}

/* ========================================
   UI UPDATES - Update tampilan berdasarkan status login
   ======================================== */
function setLoggedUI(user){
  const el = document.querySelector('[data-user-name]');
  const btnLogin = document.querySelector('[data-btn-login]');
  const btnLogout = document.querySelector('[data-btn-logout]');
  
  if (user){
    // Jika user login, tampilkan nama dan tombol logout
    if (el) el.textContent = user.name || user.username || '';
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = '';
  } else {
    // Jika tidak login, tampilkan tombol login
    if (el) el.textContent = '';
    if (btnLogin) btnLogin.style.display = '';
    if (btnLogout) btnLogout.style.display = 'none';
  }
}

/* ========================================
   NAVIGATION - Fungsi navigasi
   ======================================== */
function goto(url){ window.location.href = url; }

/* ========================================
   TESTIMONIAL SLIDER - Navigasi slider testimoni
   ======================================== */
document.addEventListener('DOMContentLoaded', ()=>{
  const track = document.querySelector('[data-testimonial-track]');
  if(!track) return;
  const prev = document.querySelector('.testimonial-wrap .prev');
  const next = document.querySelector('.testimonial-wrap .next');
  const step = 380; // px
  prev?.addEventListener('click', ()=> track.scrollBy({ left: -step, behavior: 'smooth' }));
  next?.addEventListener('click', ()=> track.scrollBy({ left: step, behavior: 'smooth' }));
});

/* ========================================
   ROLE-BASED ACCESS CONTROL - Kontrol akses berdasarkan role
   ======================================== */
async function requireLoginAndRole(requiredRole){
  const r = await getSession();
  const user = r.user;
  
  // Jika tidak login, redirect ke halaman login
  if(!user){
    goto('./login.html');
    return Promise.reject('UNAUTH');
  }
  
  setLoggedUI(user);
  applyRoleVisibility(user);
  
  // Jika role tidak cocok, arahkan ke halaman yang sesuai perannya
  if(requiredRole && user.role !== requiredRole){
    if(user.role === 'terapis') goto('./absensi.html');
    else goto('./dashboard.html');
    return Promise.reject('FORBIDDEN');
  }
  return user;
}

/* ========================================
   ROLE VISIBILITY - Tampilkan elemen berdasarkan role
   ======================================== */
function applyRoleVisibility(user){
  // Tampilkan elemen berdasarkan atribut data-role
  document.querySelectorAll('[data-role]')
    .forEach(el=>{
      const roles = (el.getAttribute('data-role')||'').split(',').map(s=>s.trim());
      el.style.display = roles.includes(user.role) ? '' : 'none';
    });
  
  // Nonaktifkan kontrol edit untuk orangtua (kecuali foto profil)
  if(user.role === 'orangtua'){
    document.querySelectorAll('[data-editable-parent="false"] input, [data-editable-parent="false"] select, [data-editable-parent="false"] textarea, [data-editable-parent="false"] button')
      .forEach(el=> el.disabled = true);
  }
}

/* ========================================
   GLOBAL EXPORTS - Export fungsi untuk digunakan di halaman lain
   ======================================== */
window.requireLoginAndRole = requireLoginAndRole;
window.applyRoleVisibility = applyRoleVisibility;

/* ========================================
   NOTIFICATIONS - Fetch & toggle dropdown on any page
   ======================================== */
document.addEventListener('DOMContentLoaded', ()=>{
  const bell = document.getElementById('btnBell');
  let panel = document.getElementById('notifPanel');
  let body = document.getElementById('notifBody');
  if (!bell) return;

  // If dropdown container is missing, create it next to the bell
  if (!panel || !body){
    const right = bell.parentElement;
    const wrap = document.createElement('div');
    wrap.className = 'dropdown';
    wrap.id = 'notifPanel';
    wrap.style.display = 'none';
    wrap.innerHTML = '<div class="dropdown-title">Notifikasi</div><div class="dropdown-body" id="notifBody"><div class="dropdown-item">Tidak ada notifikasi</div></div>';
    right?.appendChild(wrap);
    panel = wrap;
    body = panel.querySelector('#notifBody');
  }

  async function loadNotifications(){
    try{
      body.innerHTML = '<div class="dropdown-item">Memuat...</div>';
      // Load notifikasi dan status blok reschedule
      const [res, status] = await Promise.all([
        api('notifications.php').catch(()=>({items:[]})),
        api('reschedule_status.php').catch(()=>({ok:false}))
      ]);
      const items = res.items || [];
      if(status?.ok && status.blocked){
        items.unshift({
          title: 'Reschedule Diblokir',
          message: `Total ketidakhadiran bulan ini: ${status.count}. Hak reschedule bulan ini hangus.`,
          severity: 'warning'
        });
      }
      if (!items.length){
        body.innerHTML = '<div class="dropdown-item">Tidak ada notifikasi</div>';
        return;
      }
      body.innerHTML = items.map(n=>
        `<div class="dropdown-item">
           <div style="font-weight:700">${n.title||'Notifikasi'}</div>
           <div style="color:#64748b">${n.message||''}</div>
         </div>`
      ).join('');
    }catch(e){
      body.innerHTML = '<div class="dropdown-item">Gagal memuat notifikasi</div>';
    }
  }

  bell.addEventListener('click', async (e)=>{
    e.stopPropagation();
    const willShow = panel.style.display==='none' || panel.style.display==='';
    if (willShow){ await loadNotifications(); }
    panel.style.display = willShow ? 'block' : 'none';
  });

  document.addEventListener('click', (e)=>{
    const path = e.composedPath ? e.composedPath() : [];
    if (!panel.contains(e.target) && e.target!==bell && !path.includes(bell)){
      panel.style.display='none';
    }
  });
});

/* ========================================
   GLOBAL NAV - Hamburger and logo actions on any page
   ======================================== */
document.addEventListener('DOMContentLoaded', ()=>{
  const toggle = document.getElementById('btnToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar){
    toggle.addEventListener('click', ()=>{
      // Support both .show and .collapsed patterns used across pages
      if (sidebar.classList.contains('show')) sidebar.classList.toggle('show');
      else sidebar.classList.toggle('collapsed');
    });
    toggle.addEventListener('keydown', (e)=>{
      if(e.key==='Enter' || e.key===' '){
        e.preventDefault();
        if (sidebar.classList.contains('show')) sidebar.classList.toggle('show');
        else sidebar.classList.toggle('collapsed');
      }
    });
  }

  // Clickable brand/logo → back to public homepage
  const brandTargets = document.querySelectorAll('.topbar-logo, .brand img, .brand .name, .topbar-title');
  brandTargets.forEach(el=>{
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=> goto('./index.html'));
  });
});


const hamburger = document.getElementById("hamburger-btn");
const navLinks = document.querySelector(".nav-links");

if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    hamburger.textContent = navLinks.classList.contains("active") ? "✕" : "☰";
  });
}
