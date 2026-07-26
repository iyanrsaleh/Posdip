/*
 * Rute: explorer
 * Terdaftar di routing.js (action: 'explorer', module: './explorer/index.js').
 *
 * Gateway (daftar kartu) GENERIK — TIDAK boleh hardcode nama dokumen satu-satu,
 * karena daftar storage bisa terus bertambah dari editor skema (production.js)
 * tanpa perlu sentuh file ini. Daftar didapat dari NxStorage.list() (endpoint
 * index.js GET /nexa-storage/:extension).
 *
 * Tapi RENDER per-dokumen (form & tabel) SENGAJA dipisah per folder
 * (explorer/{doc}/form.js, explorer/{doc}/tabel.js) — bukan logic tunggal di
 * file ini untuk semua dokumen. Alasan: dua tabel data BISA kebetulan mirip
 * (mis. mscp & ipkd sekarang), tapi tidak ada jaminan itu berlaku selamanya —
 * dokumen baru bisa butuh validasi/aksi/layout yang beda total. Kalau semua
 * dipaksa lewat satu logic generik, itu akan berakhir jadi tumpukan
 * if/else per nama dokumen yang sulit dirawat.
 *
 * Kontrak tiap folder explorer/{doc}/:
 *   - form.js  → export async function render(container, data)
 *   - tabel.js → export async function render(container, data)
 * `data` adalah hasil `await NxStorage(doc)` (skema production sudah dibaca,
 * sudah divalidasi ada) — folder tidak perlu fetch ulang.
 *
 * Kalau folder/file belum ada (dokumen baru belum di-setup manual), FALLBACK ke
 * renderDocumentTable/renderDocumentForm — versi MINIMAL di file ini (bukan
 * salinan lengkap seperti explorer/mscp atau explorer/ipkd, sengaja tidak
 * dikembangkan lebih jauh dari sekadar formBuilder.js/tableBuilder.js polos) —
 * supaya dokumen baru tetap langsung jalan tanpa perlu bikin folder dulu.
 * Begitu dokumen butuh tampilan yang layak/kustom, buat folder explorer/{doc}/
 * (salin dari explorer/ipkd/ sebagai contoh) — JANGAN kembangkan fallback di
 * file ini jadi lengkap, itu justru mengulang masalah "satu file untuk semua
 * dokumen" yang pola ini coba hindari.
 *
 * Tiap kartu dokumen di gateway menampilkan aksi/menu SESUAI yang didaftarkan
 * modul dokumen itu sendiri lewat explorer/{doc}/index.js (export const MENU),
 * BUKAN daftar tombol statis di file ini. Kalau {doc}/index.js belum ada atau
 * belum export MENU, gateway pakai fallback 2 tombol default ("Lihat Tabel" /
 * "+ Tambah Data") supaya dokumen baru tetap langsung punya kartu yang berfungsi.
 *
 * Kontrak MENU (opsional, di explorer/{doc}/index.js):
 *   export const MENU = [
 *     { view: 'table', label: 'Lihat Tabel', appearance: 'stealth', icon: 'table' },
 *     { view: 'form',  label: '+ Tambah Data', appearance: 'accent', icon: 'add' },
 *     { view: 'chart', label: 'Lihat Chart', appearance: 'stealth', icon: 'chart_multiple' }, // contoh menu tambahan
 *   ];
 * `icon` adalah NAMA DASAR Fluent System Icons (tanpa ukuran/varian, mis.
 * "table" → class dirender otomatis jadi "icon-ic_fluent_table_16_regular" —
 * font resmi Microsoft, sudah aktif lewat assets/modules/icons/fluent/
 * index.css, lihat catatan.md §7-13). BUKAN lagi Material Symbols (diganti
 * dari "table_chart"/"bar_chart" ke "table"/"chart_multiple" supaya konsisten
 * satu sumber ikon dengan sidebar/menu OAuth, §13), dan BUKAN path/data-URI
 * dari Icon.js — icon boleh diisi null/dihilangkan kalau tidak perlu ikon.
 * `view` harus punya export render-nya sendiri di index.js (mis. `renderChart`
 * untuk view 'chart', ikuti pola renderTabel/renderForm) — lihat renderDocForView.
 *
 * Sub-view dibaca dari config.explorerDoc + config.explorerView (nama bebas
 * sesuai `view` di MENU, default "form") — pola sama dengan oauth.js
 * (config.oauthView), lihat templates/nxvisual/README.md Section 3b. Tidak
 * didaftarkan di routing.js/ROUTES karena bukan menu sidebar.
 */

let _viewId = null;

export async function render(container, config) {
  _viewId = config?.viewId || _viewId;
  const oauth = window.NXUI?.ref ? await window.NXUI.ref.get('bucketsStore', 'oauth') : null;
  // Sinkronkan window.NEXA.userId dari bucketsStore('oauth') SETIAP kali Explorer
  // dibuka — window.NEXA di-reset tiap reload app (in-memory), beda dari
  // bucketsStore (IndexedDB, persisten). Tanpa ini, window.NEXA.userId bisa
  // kosong/0 setelah reload walau user sebelumnya sudah login (oauth masih
  // valid di storage) — form.js/edit.js tiap modul cukup baca window.NEXA.userId
  // langsung tanpa fetch bucketsStore sendiri (lihat explorer/{doc}/form.js).
  if (oauth && window.NXUI?.syncNexaAuth) await window.NXUI.syncNexaAuth();
  if (!oauth) {
    const ICON_SRC = await import('../../Icon.js');
    container.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 140px);">
      <img src="${ICON_SRC.icon_user}" alt="" style="width: 64px; height: 64px; opacity: 0.4; margin-bottom: 16px;" />
      <p style="color: var(--beranda-dv-text-muted); font-size: 14px; margin: 0;">Belum login. Buka menu OAuth untuk masuk.</p>
    </div>`;
    return;
  }

  const doc = config?.explorerDoc || null;
  const view = config?.explorerView || (doc ? 'form' : null);
  if (doc && view === 'table') return renderDocForView(container, doc, 'tabel', 'renderTabel', renderDocumentTable);
  if (doc && view === 'form') return renderDocForView(container, doc, 'form', 'renderForm', renderDocumentForm);
  if (doc) return renderDocForView(container, doc, view, viewToExportName(view), renderDocumentForm);
  return renderGateway(container);
}

/** view 'chart' → 'renderChart', dst — konvensi export di explorer/{doc}/index.js. */
function viewToExportName(view) {
  return 'render' + String(view).charAt(0).toUpperCase() + String(view).slice(1);
}

/**
 * Muat modul per-dokumen lewat explorer/{doc}/index.js (hub re-export —
 * kontrak: export { render as renderTabel } from './tabel.js' dan
 * export { render as renderForm } from './form.js', plus komponen tambahan
 * dokumen itu kalau ada, mis. export { render as renderChart } from './chart.js').
 * Kalau index.js belum ada/belum re-export nama tersebut, DAN view adalah
 * 'tabel'/'form' bawaan, coba langsung import explorer/{doc}/{moduleName}.js
 * sebagai kompatibilitas mundur. Kalau semua gagal, pakai fallback generik.
 * `data` (hasil NxStorage(doc)) di-fetch SEKALI di sini lalu diteruskan,
 * supaya folder per-dokumen tidak perlu fetch ulang.
 */
async function renderDocForView(container, doc, moduleName, exportName, fallbackFn) {
  const data = await NxStorage(doc).catch((err) => {
    console.error(`[explorer] gagal baca storage ${doc}:`, err.message);
    return null;
  });

  try {
    const hub = await import(`./${doc}/index.js`);
    if (typeof hub[exportName] === 'function') {
      return hub[exportName](container, data);
    }
  } catch (err) {
    // index.js belum ada/gagal dimuat — normal untuk dokumen baru, lanjut ke fallback di bawah.
  }

  if (moduleName === 'tabel' || moduleName === 'form') {
    try {
      const mod = await import(`./${doc}/${moduleName}.js`);
      if (typeof mod.render === 'function') {
        return mod.render(container, data);
      }
    } catch (err) {
      // Folder/file belum ada — normal untuk dokumen baru, lanjut ke fallback generik.
    }
  }

  return fallbackFn(container, doc, data);
}

/** Ganti sub-view tanpa reload seluruh panel — dipicu klik tombol kartu atau link "kembali". */
export function gotoExplorerDoc(doc, view = 'form') {
  if (!_viewId) return;
  window.dispatchEvent(new CustomEvent('beranda:open-developer-tab', {
    detail: { viewId: _viewId, contentType: 'explorer', explorerDoc: doc, explorerView: view },
  }));
}

async function renderGateway(container) {
  await window.NX.defineFluent(['fluentCard', 'fluentButton']);

  container.innerHTML = `
    <div style="padding: 24px; max-width:900px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Explorer</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Pilih dokumen yang ingin dikelola.</p>
      <div id="nxv-explorer-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Memuat daftar dokumen…</p>
      </div>
    </div>
  `;

  const cardsHost = container.querySelector('#nxv-explorer-cards');

  const { DOKUMEN } = await import('./registrasi.js');

  if (!DOKUMEN.length) {
    cardsHost.innerHTML = `<p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Belum ada dokumen terdaftar di registrasi.js.</p>`;
    return;
  }

  const DEFAULT_MENU = [
    { view: 'table', label: 'Lihat Tabel', appearance: 'stealth', icon: 'table' },
    { view: 'form', label: '+ Tambah Data', appearance: 'accent', icon: 'add' },
  ];

  const menusByDoc = await Promise.all(DOKUMEN.map((c) => resolveDocMenu(c.name, DEFAULT_MENU)));

  cardsHost.innerHTML = DOKUMEN.map((c, i) => {
    const menu = menusByDoc[i];
    const buttons = menu.map((m) => `<fluent-button appearance="${m.appearance || 'stealth'}" size="small" data-doc-action="${m.view}" data-doc="${c.name}">${m.icon ? `<i slot="start" class="icon-ic_fluent_${m.icon}_16_regular" style="font-size: 16px; line-height: 1; display: inline-flex; align-items: center; vertical-align: middle; margin-right: -6px;"></i>` : ''}${m.label}</fluent-button>`).join('');

    return `
    <fluent-card data-doc="${c.name}" style="padding: 16px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box;">
      <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: var(--beranda-dv-text);">${c.appname}</h3>
      ${c.deskripsi ? `<p style="margin: 0 0 12px; font-size: 12px; color: var(--beranda-dv-text-muted);">${c.deskripsi}</p>` : '<div style="margin-bottom: 12px;"></div>'}
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: auto;">
        ${buttons}
      </div>
    </fluent-card>
  `;
  }).join('');

  cardsHost.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('[data-doc-action]');
    if (!btn) return;
    gotoExplorerDoc(btn.dataset.doc, btn.dataset.docAction);
  });
}

/**
 * Ambil MENU yang didaftarkan modul explorer/{doc}/index.js sendiri (kontrak:
 * export const MENU = [{ view, label, appearance?, icon? }, ...]). Kalau
 * index.js belum ada, belum export MENU, atau MENU kosong, pakai defaultMenu
 * (2 tombol bawaan) — supaya dokumen baru tetap punya kartu yang berfungsi
 * tanpa perlu setup index.js dulu.
 */
async function resolveDocMenu(doc, defaultMenu) {
  try {
    const hub = await import(`./${doc}/index.js`);
    if (Array.isArray(hub.MENU) && hub.MENU.length > 0) return hub.MENU;
  } catch (err) {
    // index.js belum ada/gagal dimuat — pakai default.
  }
  return defaultMenu;
}

/**
 * Fallback MINIMAL — dipakai HANYA kalau explorer/{doc}/tabel.js atau form.js
 * belum ada (dokumen baru yang belum di-setup folder khusus). Sengaja tidak
 * selengkap tampilan mscp/ipkd (tanpa export, tanpa upload progress bar, dll)
 * — begitu dokumen butuh tampilan yang layak, buat foldernya (lihat
 * explorer/ipkd/tabel.js atau explorer/ipkd/form.js sebagai contoh awal untuk
 * disalin & disesuaikan), jangan kembangkan fallback ini jadi lengkap lagi.
 */
async function renderDocumentTable(container, doc, data) {
  const { mountGeneratedTable, columnsFromSchema } = await import('../../helper/tableBuilder.js');

  if (!data?.production) {
    container.innerHTML = `<div style="padding: 24px;"><p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Skema tabel (storage/${doc}.json → production) tidak ditemukan.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || doc}</h2>
      <div id="nx-generated-table-host"></div>
    </div>
  `;

  await mountGeneratedTable(container.querySelector('#nx-generated-table-host'), {
    source: data,
    columns: columnsFromSchema(data),
    pageSize: 10,
    actions: { view: true, edit: true, delete: true },
  });
}

async function renderDocumentForm(container, doc, data) {
  const { mountGeneratedForm } = await import('../../helper/formBuilder.js');

  if (!data?.production) {
    container.innerHTML = `<div style="padding: 24px;"><p style="color: var(--beranda-dv-text-muted); font-size: 13px;">Skema form (storage/${doc}.json → production) tidak ditemukan.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width: 560px; margin: 0 auto;">
      <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || doc}</h2>
      <div id="nx-generated-form-host"></div>
    </div>
  `;

  await mountGeneratedForm(container.querySelector('#nx-generated-form-host'), data, {
    onSubmit: (values) => console.log(`[explorer/${doc}] submit (fallback, belum ada folder khusus):`, values),
  });
}
