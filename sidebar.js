// Nama icon merujuk ke variabel export di templates/Icon.js (data URI base64) —
// di-render sebagai <img>, bukan lagi font-icon Material Symbols.
//
// Prefix "fluent-color:{nama}" (mis. "fluent-color:people") merujuk ke file
// SVG BERWARNA resmi Fluent System Icons di
// assets/modules/icons/fluent/ic_fluent_{nama}_24_color.svg (lihat catatan.md
// §10-12) — sumber terpisah dari Icon.js, dipakai lewat path langsung, bukan
// ICON_SRC. Tanpa prefix ini, iconKey tetap di-resolve dari Icon.js seperti
// biasa (non-breaking untuk entry ROUTES lain yang belum dimigrasi).
let ICON_SRC = null;
const FLUENT_COLOR_BASE = '/assets/modules/icons/fluent/';

async function loadIconSrc() {
  if (!ICON_SRC) ICON_SRC = await import('../Icon.js');
  return ICON_SRC;
}

function iconImg(iconKey, extraClass = 'nxv-sidebar__item-icon') {
  if (iconKey?.startsWith('fluent-color:')) {
    const name = iconKey.slice('fluent-color:'.length);
    const src = `${FLUENT_COLOR_BASE}ic_fluent_${name}_24_color.svg`;
    return `<img src="${src}" alt="" class="${extraClass}" />`;
  }
  const src = ICON_SRC?.[iconKey] || '';
  return `<img src="${src}" alt="" class="${extraClass}" />`;
}

function renderProfileFooter(oauth) {
  if (!oauth) {
    return `
      <div class="nxv-sidebar__profile nxv-sidebar__profile--empty">
        ${iconImg('fluent-color:people', 'nxv-sidebar__profile-avatar nxv-sidebar__profile-avatar--placeholder')}
        <span class="nxv-sidebar__profile-name">Belum login</span>
      </div>
    `;
  }
  return `
    <div class="nxv-sidebar__profile">
      ${oauth.avatar ? `<img src="${oauth.avatar}" alt="" class="nxv-sidebar__profile-avatar" />` : iconImg('fluent-color:people', 'nxv-sidebar__profile-avatar nxv-sidebar__profile-avatar--placeholder')}
      <div class="nxv-sidebar__profile-info">
        <span class="nxv-sidebar__profile-name">${oauth.nama || '-'}</span>
        <span class="nxv-sidebar__profile-email">${oauth.email || '-'}</span>
      </div>
    </div>
  `;
}

/**
 * Key localStorage yang sama dipakai templates/source.js (LAST_TAB_KEY_PREFIX)
 * untuk memulihkan tab panel aktif setelah refresh — dibaca di sini juga supaya
 * highlight menu sidebar konsisten dengan tab yang benar-benar sedang tampil.
 * `viewId` dioper dari index.js (this.id) — TIDAK di-hardcode 'nxvisual', karena
 * nama folder/id extension bisa berbeda (hasil clone lain, lihat
 * templates/.nexa-clone-meta.json).
 */
function getLastActiveAction(viewId, fallback) {
  try {
    return localStorage.getItem('nx-ext-shell-last-tab:' + viewId) || fallback;
  } catch {
    return fallback;
  }
}

/* ── Collapse sidebar (rail mode) ──────────────────────────────────────────
 * Saat diciutkan, .nx-ext-shell__sidebar dikunci selebar RAIL_WIDTH dan
 * .nxv-sidebar dapat class is-collapsed (label + info profil disembunyikan
 * lewat CSS, hanya ikon & avatar yang tersisa) — area kerja jadi lebih lega.
 *
 * Dua hal yang WAJIB ikut diurus, kalau tidak panel konten salah posisi:
 *   1. `--nx-ext-sidebar-offset` di .nx-ext-shell__body — dipakai
 *      .nx-ext-shell__panel sebagai `left` (assets/css/style.css:482).
 *   2. Lebar hasil drag resizer (templates/source.js#initSidebarResize)
 *      disimpan di localStorage 'nx-ext-shell-sidebar-width' dan dipasang
 *      sebagai inline `style.flex`. Lebar itu DIPULIHKAN saat dibentangkan
 *      lagi — bukan direset ke default — supaya hasil drag user tidak hilang.
 */
const SIDEBAR_COLLAPSED_KEY = 'nx-ext-shell-sidebar-collapsed:';
const SIDEBAR_WIDTH_KEY = 'nx-ext-shell-sidebar-width';
const SIDEBAR_RESIZER_WIDTH = 4; // .nx-ext-shell__resizer (flex: 0 0 4px)
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_RAIL_WIDTH = 56;

function expandedWidth() {
  const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
  return saved > 0 ? saved : SIDEBAR_DEFAULT_WIDTH;
}

function applySidebarWidth(sidebarEl, width) {
  sidebarEl.style.flex = `0 0 ${width}px`;
  sidebarEl.parentElement?.style.setProperty('--nx-ext-sidebar-offset', `${width + SIDEBAR_RESIZER_WIDTH}px`);
}

function wireSidebarToggle(container, viewId) {
  const btn = container.querySelector('#nxv-sidebar-toggle');
  const root = container.querySelector('.nxv-sidebar');
  // .nx-ext-shell__sidebar adalah induk dari `container` (di-render source.js).
  const sidebarEl = container.closest('.nx-ext-shell__sidebar') || container.parentElement;
  if (!btn || !root || !sidebarEl) return;

  const storeKey = SIDEBAR_COLLAPSED_KEY + viewId;
  const setState = (collapsed, persist) => {
    root.classList.toggle('is-collapsed', collapsed);
    // Resizer tidak berguna saat rail — lebarnya dikunci.
    sidebarEl.nextElementSibling?.classList?.toggle('is-disabled', collapsed);
    btn.setAttribute('aria-expanded', String(!collapsed));
    const label = collapsed ? 'Workspace — bentangkan sidebar' : 'Workspace — ciutkan sidebar';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    applySidebarWidth(sidebarEl, collapsed ? SIDEBAR_RAIL_WIDTH : expandedWidth());
    if (persist) {
      try { localStorage.setItem(storeKey, collapsed ? '1' : '0'); } catch { /* storage penuh/diblokir */ }
    }
  };

  let collapsed = false;
  try { collapsed = localStorage.getItem(storeKey) === '1'; } catch { /* abaikan */ }
  setState(collapsed, false); // pulihkan kondisi terakhir tanpa menulis ulang

  btn.addEventListener('click', () => {
    collapsed = !collapsed;
    setState(collapsed, true);
  });
}

export async function renderSidebar(container, viewId) {
  const { ROUTES, DEFAULT_ACTION } = await import('./routing.js');
  await loadIconSrc();

  const activeAction = getLastActiveAction(viewId, DEFAULT_ACTION);
  const oauth = window.NXUI?.ref ? await window.NXUI.ref.get('bucketsStore', 'oauth') : null;

  // Tampilan bergaya Windows 11 Settings: list flat dengan indikator aktif
  // pill aksen (bukan card per-item seperti sidebar app pada umumnya).
  // Kotak pencarian sengaja TIDAK ada di sini — dipindah ke tempat lain
  // (bukan di sidebar), lihat riwayat perubahan.
  container.innerHTML = `
    <div class="nxv-sidebar">
    <div class="nxv-sidebar-item">

      <div class="nxv-sidebar__list" id="nxv-list">
        <button
          type="button"
          class="nxv-sidebar__item nxv-sidebar__toggle"
          id="nxv-sidebar-toggle"
          title="Workspace — ciutkan sidebar"
          aria-label="Workspace — ciutkan sidebar"
          aria-expanded="true"
        >
          <svg class="nxv-sidebar__item-icon nxv-sidebar__toggle-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span class="nxv-sidebar__item-label">Workspace</span>
        </button>
        ${ROUTES.map((item) => `
          <button
            type="button"
            class="nxv-sidebar__item${item.action === activeAction ? ' is-active' : ''}"
            data-action="${item.action}"
            data-label="${item.label.toLowerCase()}"
            title="${item.label}"
          >
            ${iconImg(item.icon)}
            <span class="nxv-sidebar__item-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
      </div>

      <div class="nxv-sidebar__footer" id="nxv-footer">
        ${renderProfileFooter(oauth)}
      </div>
    </div>
  `;

  wireSidebarToggle(container, viewId);

  const footer = container.querySelector('#nxv-footer');

  // oauth.js memancarkan event ini setelah login sukses (bucketsStore berubah) —
  // render ulang kartu profil saja, tanpa reload aplikasi atau sentuh list.
  const onOauthChanged = (ev) => {
    if (!footer.isConnected) {
      window.removeEventListener('nxvisual:oauth-changed', onOauthChanged);
      return;
    }
    footer.innerHTML = renderProfileFooter(ev.detail);
  };
  window.addEventListener('nxvisual:oauth-changed', onOauthChanged);

  container.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action]');
    if (!btn) return;

    container.querySelectorAll('.nxv-sidebar__item').forEach((el) => el.classList.remove('is-active'));
    btn.classList.add('is-active');

    window.dispatchEvent(new CustomEvent('beranda:open-developer-tab', {
      detail: {
        viewId,
        contentType: btn.dataset.action,
      },
    }));
  });
}
