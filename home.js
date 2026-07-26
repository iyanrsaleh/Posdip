/*
 * Rute: home
 * Terdaftar di routing.js (action: 'home').
 *
 * Dashboard bergaya Windows 11 Settings homepage — bukan lagi sekadar
 * daftar row profil polos: hero card besar (avatar + sapaan dinamis pagi/
 * siang/malam), grid Quick Actions (ke Explorer/Search/History/OAuth/
 * Settings/Help, pakai ikon Fluent System Icons Color — lihat catatan.md
 * §7-17), lalu SATU card ringkasan "Akun" (paket, login/aktivitas
 * terakhir).
 *
 * Card "Identitas"/"Lokasi" (role/jabatan/instansi/telepon/alamat/lokasi)
 * SENGAJA DIHILANGKAN dari Home — bukan informasi yang perlu tampil di
 * halaman utama, cukup ringkas (hero: nama+email+instansi) + Quick Actions.
 * Data lengkap identitas/lokasi tetap ada di sesi oauth (bucketsStore),
 * cuma tidak lagi dirender di sini.
 *
 * Data oauth aktif tetap dari bucketsStore('oauth') seperti sebelumnya —
 * bagian ini TIDAK berubah secara fungsional, cuma tampilannya diperkaya.
 */

function row(label, value) {
  if (!value) return '';
  return `
    <div style="display: flex; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--beranda-dv-header-border);">
      <span style="font-size: 12px; color: var(--beranda-dv-text-faint);">${label}</span>
      <span style="font-size: 12px; color: var(--beranda-dv-text); text-align: right;">${value}</span>
    </div>
  `;
}

function sectionCard({ title, iconColor, rows }) {
  if (!rows) return '';
  return `
    <fluent-card style="padding: 16px; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <img src="${FLUENT_COLOR_BASE}ic_fluent_${iconColor}_24_color.svg" alt="" style="width: 18px; height: 18px; object-fit: contain;" />
        <p style="margin: 0; font-size: 12px; font-weight: 600; color: var(--beranda-dv-text-faint); text-transform: uppercase; letter-spacing: 0.03em;">${title}</p>
      </div>
      ${rows}
    </fluent-card>
  `;
}

const FLUENT_COLOR_BASE = '/assets/modules/icons/fluent/';

const QUICK_ACTIONS = [
  { action: 'explorer', label: 'Explorer', desc: 'Kelola dokumen & data', icon: 'document_folder' },
  { action: 'search', label: 'Search', desc: 'Cari menu & dokumen', icon: 'search_sparkle' },
  { action: 'history', label: 'History', desc: 'Riwayat aktivitas', icon: 'history' },
  { action: 'oauth', label: 'Akun', desc: 'Sign in / profil', icon: 'people' },
  { action: 'settings', label: 'Settings', desc: 'Konfigurasi extension', icon: 'settings' },
  { action: 'help', label: 'Help', desc: 'Bantuan & dokumentasi', icon: 'question_circle' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

let ICON_SRC = null;
let _viewId = null;

async function readPackageInfo() {
  try {
    const base = new URL('.', import.meta.url).href;
    const res = await fetch(base + 'package.json', { cache: 'no-store' });
    return await res.json();
  } catch {
    return {};
  }
}

function openTab(contentType) {
  if (!_viewId) return;
  window.dispatchEvent(new CustomEvent('beranda:open-developer-tab', {
    detail: { viewId: _viewId, contentType },
  }));
}

export async function render(container, config) {
  _viewId = config?.viewId || _viewId;
  await window.NX.defineFluent(['fluentCard', 'fluentButton']);
  if (!ICON_SRC) ICON_SRC = await import('../Icon.js');

  const pkg = await readPackageInfo();
  const oauth = window.NXUI?.ref ? await window.NXUI.ref.get('bucketsStore', 'oauth') : null;
  const data = oauth?.data || {};

  const akunRows = [
    row('Paket', data.package),
    row('Login terakhir', data.login_time),
    row('Aktivitas terakhir', data.last_activity),
  ].join('');

  const namaDepan = (oauth?.nama || '').split(' ')[0] || '';

  const quickActionsHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px;">
      ${QUICK_ACTIONS.map((q) => `
        <fluent-card class="nxv-home-quick-tile" data-quick-action="${q.action}" style="padding: 14px 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; transition: transform 0.12s ease, box-shadow 0.12s ease;">
          <img src="${FLUENT_COLOR_BASE}ic_fluent_${q.icon}_24_color.svg" alt="" style="width: 28px; height: 28px; object-fit: contain;" />
          <div>
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: var(--beranda-dv-text);">${q.label}</p>
            <p style="margin: 2px 0 0 0; font-size: 10.5px; color: var(--beranda-dv-text-muted); line-height: 1.3;">${q.desc}</p>
          </div>
        </fluent-card>
      `).join('')}
    </div>
  `;

  const heroHtml = oauth ? `
    <fluent-card style="padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, color-mix(in srgb, var(--beranda-dv-accent) 14%, var(--beranda-dv-surface)), var(--beranda-dv-surface)); border: 1px solid var(--beranda-dv-header-border);">
      <div style="display: flex; align-items: center; gap: 16px;">
        ${oauth.avatar
          ? `<img src="${oauth.avatar}" alt="" style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover; flex: 0 0 auto; border: 2px solid var(--beranda-dv-surface); box-shadow: 0 0 0 2px var(--beranda-dv-accent);" />`
          : `<img src="${FLUENT_COLOR_BASE}ic_fluent_people_24_color.svg" alt="" style="width: 64px; height: 64px; border-radius: 50%; object-fit: contain; padding: 14px; background: var(--beranda-dv-hover); flex: 0 0 auto;" />`
        }
        <div style="min-width: 0;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">${greeting()}${namaDepan ? ',' : ''}</p>
          <p style="margin: 2px 0 0 0; font-size: 20px; font-weight: 700; color: var(--beranda-dv-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${oauth.nama || '-'}</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--beranda-dv-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${oauth.email || '-'}${data.instansi ? ` · ${data.instansi}` : ''}</p>
        </div>
      </div>
    </fluent-card>
  ` : `
    <fluent-card style="padding: 28px 16px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;">
      <img src="${FLUENT_COLOR_BASE}ic_fluent_people_24_color.svg" alt="" style="width: 40px; height: 40px; object-fit: contain; padding: 10px; border-radius: 50%; background: var(--beranda-dv-hover);" />
      <p style="margin: 0; font-size: 15px; font-weight: 600; color: var(--beranda-dv-text);">${greeting()}!</p>
      <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted); max-width: 320px;">Belum masuk — buka menu Akun untuk sign in dan lihat ringkasan profil di sini.</p>
      <fluent-button appearance="accent" data-quick-action="oauth" style="margin-top: 4px;">Masuk sekarang</fluent-button>
    </fluent-card>
  `;

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; align-items: center; gap: 10px; margin: 0 0 4px 0;">
        <img src="${ICON_SRC.icon_home_small}" alt="" style="width: 22px; height: 22px; object-fit: contain;" />
        <h2 style="margin: 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${pkg.title || 'nxvisual'}</h2>
        ${pkg.version ? `<span style="font-size: 12px; color: var(--beranda-dv-text-faint);">v${pkg.version}</span>` : ''}
      </div>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Ringkasan akun & akses cepat ke seluruh fitur.</p>

      ${heroHtml}

      ${quickActionsHtml}

      ${oauth ? `
        ${sectionCard({ title: 'Akun', iconColor: 'settings', rows: akunRows })}
      ` : ''}
    </div>
  `;

  container.querySelectorAll('[data-quick-action]').forEach((el) => {
    el.addEventListener('click', () => openTab(el.dataset.quickAction));
  });
  container.querySelectorAll('.nxv-home-quick-tile').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'translateY(-2px)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translateY(0)';
      el.style.boxShadow = 'none';
    });
  });
}
