/*
 * Route registry — satu titik pendaftaran rute nxvisual.
 *
 * Tambah rute baru = tambah satu entry di ROUTES + satu file modul baru.
 * sidebar.js merender menu dari sini, panel.js me-resolve modul dari sini —
 * tidak perlu edit sidebar.js / panel.js secara manual lagi.
 *
 * `module` adalah path relatif ke file yang mengekspor:
 *   export async function render(container, config) { ... }
 *
 * Ikuti README Section 11: file ini tidak boleh punya `import` statis
 * top-level — semua konsumsi module lain harus dynamic import di dalam fungsi.
 */

export const ROUTES = [
  {
    action: 'home',
    label: 'Home',
    icon: 'icon_home_small',
    desc: 'Halaman utama extension',
    module: './home.js',
  },
  {
    action: 'explorer',
    label: 'Explorer',
    icon: 'icon_fileexplorer',
    desc: 'Jelajahi file dan folder',
    module: './explorer/index.js',
  },
  {
    action: 'search',
    label: 'Search',
    icon: 'fluent-color:search_sparkle',
    desc: 'Cari menu navigasi & semua dokumen Explorer',
    module: '../search/index.js',
  },
  {
    action: 'history',
    label: 'History',
    icon: 'fluent-color:history',
    desc: 'Riwayat menu & dokumen yang baru dibuka',
    module: '../history/index.js',
  },
  {
    action: 'oauth',
    label: 'OAuth',
    icon: 'fluent-color:people',
    desc: 'Sign in / autentikasi',
    module: '../oauth/index.js',
  },

  {
    action: 'settings',
    label: 'Settings',
    icon: 'icon_settings_large',
    desc: 'Konfigurasi extension',
    module: '../settings/index.js',
  },

  // Konten diambil DINAMIS dari catatan rilis terbaru repo Nxadom/Fluen
  // (lihat templates/help/index.js) — bukan lagi placeholder statis.
  // Ditaruh di bawah Settings sesuai permintaan awal, sebelum entry
  // internal developer di bawah ini.
  {
    action: 'help',
    label: 'Help',
    icon: 'fluent-color:question_circle',
    desc: 'Pusat bantuan & dokumentasi',
    module: '../help/index.js',
  },

  // INTERNAL — bukan bagian dari Extension, hanya untuk developer melihat
  // daftar komponen Fluent UI Web Components yang tersedia di project ini
  // (reuse templates/fluent_demo.js, lihat devComponents.js).
  // {
  //   action: 'dev_components',
  //   label: 'Dev: Components',
  //   icon: 'icon_context_properties',
  //   desc: 'Daftar komponen Fluent UI (developer)',
  //   module: './devComponents.js',
  // },

];

export const DEFAULT_ACTION = 'home';

export function getRoute(action) {
  return ROUTES.find((r) => r.action === action) || ROUTES.find((r) => r.action === DEFAULT_ACTION);
}
