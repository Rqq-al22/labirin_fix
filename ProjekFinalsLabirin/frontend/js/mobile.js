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
      MOBILE SIDEBAR FUNCTIONALITY - Perbaikan hamburger mobile
      ======================================== */
   function initializeMobileSidebar() {
     // Hanya jalankan di mobile
     if (window.innerWidth > 768) return;
   
     const btnToggle = document.getElementById('btnToggle');
     const sidebar = document.getElementById('sidebar');
   
     if (!btnToggle || !sidebar) return;
   
     // Buat overlay jika belum ada
     let overlay = document.querySelector('.sidebar-overlay');
     if (!overlay) {
       overlay = document.createElement('div');
       overlay.className = 'sidebar-overlay';
       document.body.appendChild(overlay);
     }
   
     let isSidebarOpen = false;
   
     const openSidebar = () => {
       sidebar.classList.add('active');
       overlay.classList.add('active');
       btnToggle.innerHTML = '✕';
       isSidebarOpen = true;
       document.body.style.overflow = 'hidden';
     };
   
     const closeSidebar = () => {
       sidebar.classList.remove('active');
       overlay.classList.remove('active');
       btnToggle.innerHTML = '☰';
       isSidebarOpen = false;
       document.body.style.overflow = '';
     };
   
     // Event listener untuk hamburger
     btnToggle.addEventListener('click', (e) => {
       e.stopPropagation();
       if (isSidebarOpen) {
         closeSidebar();
       } else {
         openSidebar();
       }
     });
   
     // Tutup sidebar saat klik overlay
     overlay.addEventListener('click', closeSidebar);
   
     // Tutup sidebar saat klik di luar
     document.addEventListener('click', (e) => {
       if (isSidebarOpen && !sidebar.contains(e.target) && e.target !== btnToggle) {
         closeSidebar();
       }
     });
   
     // Tutup sidebar saat tekan Escape
     document.addEventListener('keydown', (e) => {
       if (e.key === 'Escape' && isSidebarOpen) {
         closeSidebar();
       }
     });
   }
   
   /* ========================================
      NOTIFICATIONS - Fetch & toggle dropdown on any page
      ======================================== */
   function initializeNotifications() {
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
   }
   
   /* ========================================
   INITIALIZE ALL MOBILE FUNCTIONALITIES
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar (both mobile and desktop)
    initializeSidebar();
    
    // Initialize notifications
    initializeNotifications();
    
    // Clickable brand/logo → back to public homepage
    const brandTargets = document.querySelectorAll('.topbar-logo, .brand img, .brand .name, .topbar-title');
    brandTargets.forEach(el=>{
      el.style.cursor = 'pointer';
      el.addEventListener('click', ()=> goto('./index.html'));
    });
  });
  
  // Reinitialize on resize (untuk handle orientation change dll)
  window.addEventListener('resize', initializeSidebar);




   /* ========================================
   DESKTOP SIDEBAR FUNCTIONALITY - Sidebar selalu terbuka di desktop
   ======================================== */
function initializeDesktopSidebar() {
    // Hanya jalankan di desktop
    if (window.innerWidth <= 768) return;
  
    const sidebar = document.getElementById('sidebar');
    const btnToggle = document.getElementById('btnToggle');
  
    // Pastikan sidebar terbuka di desktop
    if (sidebar) {
      sidebar.classList.remove('collapsed', 'active');
    }
  
    // Sembunyikan tombol hamburger di desktop (fallback)
    if (btnToggle) {
      btnToggle.style.display = 'none';
    }
  }
  
  /* ========================================
     UNIVERSAL SIDEBAR INITIALIZATION
     ======================================== */
  function initializeSidebar() {
    if (window.innerWidth <= 768) {
      initializeMobileSidebar();
    } else {
      initializeDesktopSidebar();
    }
  }








  /* ========================================
   GLOBAL EXPORTS - Export fungsi untuk digunakan di halaman lain
   ======================================== */
window.requireLoginAndRole = requireLoginAndRole;
window.applyRoleVisibility = applyRoleVisibility;
window.initializeMobileSidebar = initializeMobileSidebar;
window.initializeDesktopSidebar = initializeDesktopSidebar;
window.initializeSidebar = initializeSidebar; // <- TAMBAH INI