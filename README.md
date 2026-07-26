# Extension Posdip

Template extension untuk Fluen Developer Extension System.

## Struktur File

```
Posdip/
├── README.md          — dokumentasi (file ini)
├── package.json       — metadata: id, title, viewId, place, repodev
├── index.js           — export default { label, render(), renderTab() }
├── panel.js           — resolve rute dari routing.js, render modul
├── routing.js         — daftar menu sidebar (action, label, icon, module)
├── sidebar.js         — sidebar kiri (menu navigasi + search + profil)
├── styles.css         — custom CSS sidebar
├── home.js            — halaman home (info user login)
├── oauth.js           — gateway OAuth (Masuk / Lupa Password / Settings Akun)
├── oauth/
│   ├── signin.js      — form login
│   ├── signup.js      — form daftar akun
│   └── forgot.js      — form lupa password
├── explorer/
│   ├── index.js       — gateway Explorer (baca daftar dari registrasi.js)
│   ├── registrasi.js  — whitelist dokumen yang tampil di Explorer
│   ├── ipkd/
│   │   ├── tabel.js   — tampilan tabel IPKD
│   │   └── form.js    — form tambah data IPKD
│   └── mscp/
│       ├── tabel.js   — tampilan tabel MSCP
│       └── form.js    — form tambah data MSCP
└── storage/           — skema data (production field definitions)
    ├── ipkd.json
    ├── mscp.json
    └── oauth.json
```

---

## Cara Membuat Extension Baru

Gunakan script `templates/newExtension.ps1`:

```powershell
.\templates\newExtension.ps1 NamaExtension
```

Script ini otomatis:
1. Menyalin template dari `templates/Posdip/` (folder ini sendiri)
2. Mengganti semua teks `Posdip` jadi `NamaExtension` di file `.json`, `.js`, `.css`, `.md`
3. Output di `D:\Extensions\NamaExtension\`

Setelah itu push ke GitHub lalu clone di Fluen via Settings → Extension.

---

## Alur Kerja Sistem

### package.json — Single Source of Truth

```json
{
  "id": "Posdip",
  "viewId": "Posdip",
  "title": "Posdip",
  "version": "1.0.0",
  "author": "iyan",
  "icon": "assistant_navigation",
  "iconClass": "icon-folder-controller",
  "endpoint": "https://contoh.opendata.go.id",
  "repodev": "D:/Extensions/Posdip"
}
```

| Field | Wajib | Keterangan |
|-------|-------|------------|
| `id` | ✅ | Identifier unik extension |
| `viewId` | ✅ | Dipakai sebagai `view.id` di sistem — `loader.js` baca ini |
| `title` | ✅ | Judul extension |
| `version` | ❌ | Versi extension |
| `author` | ❌ | Nama pembuat |
| `icon` | ❌ | Nama icon (opsional) |
| `endpoint` | ❌ | **Auto-config endpoint backend.** Begitu extension di-clone, `loader.js` otomatis set endpoint ini ke sistem via `/nexa-config/update` — hanya kalau endpoint belum pernah di-set sebelumnya. Isi `false` untuk minta user isi manual. |
| `repodev` | ❌ | Path folder source lokal (hanya Posdip, tidak dibaca produksi) |

`loader.js` membaca `package.json` via `fetch()` dan mengambil `viewId` sebagai `id` extension.
**Extension tidak perlu hardcode `id` di `index.js`** — sistem yang inject.

**Alur auto-endpoint:**
1. `loader.js` baca `package.json` → ambil field `endpoint`
2. Kalau `endpoint` ada dan bukan `false`, cek `/nexa-config/current-origin`
3. Kalau endpoint sistem masih kosong → auto-set
4. Kalau sudah diisi user sebelumnya → tidak ditimpa

### index.js — Minimal

```js
export default {
  label: 'Posdip',
  description: 'v1.0.0',
  icon: 'folder-src',
  iconType: 'file',

  async render(container) {
    // Render sidebar
    const { renderSidebar } = await import('./sidebar.js');
    renderSidebar(container, this.id);  // this.id di-inject oleh loader.js
  },

  async renderTab(container, config) {
    // Render panel (config membawa viewId dari sistem)
    const { renderPanel } = await import('./panel.js');
    renderPanel(container, config);
  },
};
```

### routing.js — Daftar Menu Sidebar

```js
export const ROUTES = [
  { action: 'home',      label: 'Home',      module: './home.js' },
  { action: 'explorer',  label: 'Explorer',  module: './explorer/index.js' },
  { action: 'oauth',     label: 'OAuth',     module: './oauth.js' },
  { action: 'settings',  label: 'Settings',  module: '../settings/index.js' },
];
```

Module `settings` mengarah ke modul sistem (`../settings/index.js`) — tidak perlu file sendiri.

### Sub-View Routing (Gateway Pattern)

OAuth dan Explorer menggunakan pola gateway card:

1. **Gateway** — tampil saat pertama kali dibuka, berisi 2-3 card
2. **Card diklik** → dispatch event `beranda:open-developer-tab` dengan `viewId` (dari `config.viewId`, bukan hardcode)
3. **Sub-view** — render konten sesuai `config.oauthView` / `config.explorerView`

### Explorer + registrasi.js

Explorer hanya menampilkan dokumen yang terdaftar di `explorer/registrasi.js`:

```js
export const DOKUMEN = [
  { name: 'ipkd', appname: 'IPKD', deskripsi: 'Indeks Pengelolaan Keuangan Daerah' },
  { name: 'mscp', appname: 'MSCP', deskripsi: 'Monitoring, Controlling, Surveillance for Prevention' },
];
```

Untuk menambah dokumen baru:
1. Tambah entry di `registrasi.js`
2. Buat folder `explorer/<name>/` dengan `tabel.js` + `form.js`
3. Pastikan `storage/<name>.json` ada dengan field `production`

---

## Aturan Baku — Tema Terang / Gelap

Extension **wajib** mengikuti tema sistem. Semua warna pakai CSS variable:

| Variable | Kegunaan |
|----------|----------|
| `--beranda-dv-bg` | Background utama |
| `--beranda-dv-surface` | Card / surface |
| `--beranda-dv-hover` | Warna hover |
| `--beranda-dv-border` | Border standar |
| `--beranda-dv-text` | Teks utama |
| `--beranda-dv-text-muted` | Teks sekunder |
| `--beranda-dv-text-faint` | Teks redup / placeholder |
| `--beranda-dv-accent` | Warna aksen / link |

**Jangan hardcode warna**, selalu pakai `var(--beranda-dv-*)`.

---

## Cara Menambah Menu Baru di Sidebar

### 1. Buat file modul

Buat file baru, misal `kepegawaian.js`:

```js
export async function render(container, config) {
  await window.NX.defineFluent(['fluentCard']);

  container.innerHTML = `
    <div style="padding: 24px; max-width: 800px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Kepegawaian</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Halaman kepegawaian.</p>
      <fluent-card style="padding: 16px;">
        <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Konten di sini.</p>
      </fluent-card>
    </div>
  `;
}
```

### 2. Daftarkan di routing.js

Tambahkan entry baru di array `ROUTES`:

```js
{
  action: 'kepegawaian',
  label: 'Kepegawaian',
  icon: 'icon_user',
  desc: 'Data kepegawaian',
  module: './kepegawaian.js',
}
```

- `action` — identifier unik, tidak boleh sama dengan yang lain
- `label` — teks yang tampil di sidebar
- `icon` — nama variabel dari `templates/Icon.js`
- `module` — path relatif ke file modul

**Tidak perlu edit `sidebar.js` atau `panel.js`** — keduanya membaca dari `routing.js`.

---

## Cara Menambah Dokumen Baru di Explorer

### Cara cepat: `templates/newExplorer.ps1`

```powershell
.\templates\newExplorer.ps1 kepegawaian "Kepegawaian" "Data kepegawaian daerah"
```

Script ini otomatis (tidak perlu edit file manual sama sekali):
1. Generate `storage/kepegawaian.json` — skema minimal generik (field `title`
   teks, `file_path` upload dokumen, `tahun` select 2023-2027).
2. Generate folder `explorer/kepegawaian/` (`config.js`, `index.js`, `tabel.js`,
   `form.js`, `edit.js`) dari template `explorer/ipkd/`.
3. **Mendaftarkan otomatis** ke `explorer/registrasi.js` — kartu langsung
   muncul di gateway tanpa edit file itu manual.

Setelahnya, sesuaikan field di `storage/kepegawaian.json` (tambah/hapus/ubah
`type`) dan tampilan di `explorer/kepegawaian/*.js` sesuai kebutuhan nyata
dokumen ini — lihat `storage/README.md` dan `explorer/analsisi.0.1.md` untuk
pola field lengkap (`select`, `file`, `richtext`, `slug`, dll).

### Cara manual (kalau tidak pakai script)

#### 1. Tambah di registrasi.js

Buka `explorer/registrasi.js`, tambah entry:

```js
{ name: 'kepegawaian', appname: 'Kepegawaian', deskripsi: 'Data kepegawaian daerah' },
```

#### 2. Buat folder kustom

```
explorer/kepegawaian/
├── tabel.js
└── form.js
```

Salin dari `explorer/ipkd/` sebagai template lalu sesuaikan.

Kontrak: setiap file harus export `async function render(container, data)`.
`data` sudah di-fetch oleh `explorer/index.js`, tidak perlu fetch ulang.

#### 3. Buat storage schema

`storage/kepegawaian.json` — minimal harus punya field `production`:

```json
{
  "appname": "Kepegawaian",
  "deskripsi": "Data kepegawaian daerah",
  "production": {
    "tabel": "kepegawaian",
    "field": ["kepegawaian.id", "kepegawaian.nama", "..."],
    "alias": ["kepegawaian.id AS id", "..."],
    "original": ["id", "nama", "..."]
  }
}
```

### Tanpa Folder Kustom (Fallback)

Kalau folder `explorer/kepegawaian/` belum dibuat, Explorer tetap bisa membuka
dokumen tersebut — akan pakai **fallback generik** (`renderDocumentTable` / `renderDocumentForm`)
yang membaca skema dari `storage/kepegawaian.json`. Tampilannya minimal (tanpa export,
tanpa upload progress bar). Begitu butuh tampilan layak, buat foldernya.
