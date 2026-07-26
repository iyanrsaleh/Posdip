/*
 * Tampilan form dokumen "news" (Postingan) — dipanggil oleh ../index.js
 * (renderDocForView) lewat hub news/index.js, menerima `data` (hasil
 * NxStorage('news')) yang sudah di-fetch di sana (tidak perlu fetch ulang).
 *
 * File ini BERDIRI SENDIRI (bukan import balik dari ../index.js) — sengaja
 * mulai sebagai salinan logic generik (formBuilder.js + NXUI.Storage().cloud()
 * upload, pola sama ipkd/mscp), lalu disesuaikan KHUSUS untuk news: field
 * upload adalah "images" (bukan "file_path"), tanpa filter tahun, dan lebar
 * form LEBIH LEBAR dari ipkd/mscp karena news punya field yang sengaja
 * disusun berdampingan (title+slug, categori+keywords, lihat storage/news.json
 * columnWidth) — max-width sempit akan membuat pasangan col-6/col-8 itu
 * terlihat sesak. max-width di sini murni ruang MAKSIMUM form itu sendiri;
 * scroll panel (kalau form lebih tinggi dari viewport) sudah ditangani
 * .nx-ext-shell__panel di assets/css/style.css, bukan urusan file ini.
 *
 * Lebar form (max-width) datang dari CONFIG.formMaxWidth (./config.js) — SATU
 * sumber yang sama dipakai form edit di dalam tabel (lihat tabel.js), supaya
 * form tambah & form edit selalu konsisten. Ubah lebar di config.js, bukan di sini.
 *
 * Opsi field "categori" (type:"select") datang dari
 * data.production.from.categori.select.data — bagian dari skema
 * storage/news.json itu sendiri (bukan sumber terpisah). Menu Setting
 * (setting.js) mengelola daftar ini dengan update LANGSUNG ke news.json lewat
 * NxStorage('news').save(), jadi `data` yang di-fetch di sini SUDAH otomatis
 * berisi opsi kategori terkini — tidak perlu langkah tambahan di file ini.
 *
 * Field "Slug (URL)" terisi OTOMATIS dari field "Judul" saat mengetik — ini
 * SEPENUHNYA ditangani oleh formBuilder.js lewat field type:"slug" (lihat
 * storage/news.json field `slug`, punya `slugFrom: "title"` menunjuk nama
 * field sumbernya) — TIDAK ada logic tambahan di file ini, berlaku otomatis
 * untuk dokumen manapun yang pakai type:"slug" di skemanya.
 *
 * `userid` yang disimpan bersama data WAJIB dari sesi login aktif —
 * window.NEXA.userId, BUKAN hardcode angka default. explorer/index.js (root)
 * SUDAH memastikan oauth ada DAN window.NEXA.userId ter-sinkron (lewat
 * window.NXUI.syncNexaAuth()) sebelum sub-view manapun (termasuk form.js ini)
 * dipanggil — lihat render(container, config) di sana.
 */

export async function render(container, data) {
  const { mountGeneratedForm } = await import('../../../helper/formBuilder.js');
  const { CONFIG } = await import('./config.js');
  await window.NX.defineFluent(['fluentProgress', 'fluentButton', 'fluentCard']);

  if (!data?.production) {
    container.innerHTML = `
      <div style="padding: 24px; max-width: ${CONFIG.formMaxWidth}; margin: 0 auto;">
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Postingan</h2>
        <fluent-card style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Skema form (storage/news.json → production) tidak ditemukan.</p>
        </fluent-card>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width: ${CONFIG.formMaxWidth}; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || 'Postingan'}</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">${data.deskripsi || ''}</p>

      <div id="nx-upload-progress" hidden style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; color: var(--beranda-dv-text-muted);">
          <span id="nx-upload-progress-label">Mengunggah…</span>
          <span id="nx-upload-progress-percent">0%</span>
        </div>
        <fluent-progress id="nx-upload-progress-bar" value="0" min="0" max="100" style="width: 100%;"></fluent-progress>
      </div>

      <div id="nx-generated-form-host"></div>
    </div>
  `;

  const formHost = container.querySelector('#nx-generated-form-host');
  const progressWrap = container.querySelector('#nx-upload-progress');
  const progressBar = container.querySelector('#nx-upload-progress-bar');
  const progressPercent = container.querySelector('#nx-upload-progress-percent');
  const progressLabel = container.querySelector('#nx-upload-progress-label');

  const generatedForm = await mountGeneratedForm(formHost, data, {
    onSubmit: (values) => {
      const Notif = new NXUI.Notifikasi({ autoHideDelay: 3000 });

      // images adalah field type:"file" di skema (storage/news.json) — sisanya
      // (title, deskripsi, slug, categori, keywords, detail) ikut sebagai kolom
      // tambahan via `field`. userid TIDAK ikut dari form (forms:false di skema
      // — diisi dari sesi login, bukan input user, sama pola nx.methoduser).
      const { images, ...rest } = values;

      progressWrap.hidden = false;
      progressBar.value = 0;
      progressPercent.textContent = '0%';
      progressLabel.textContent = 'Mengunggah…';

      NXUI.Storage().cloud().addBackground({
        tabel: data.production.tabel || 'news',
        file: images,
        userid: window.NEXA.userId,
        fieldupload: 'images',
        field: rest,
        onProgress: (pct, loaded, total) => {
          progressBar.value = pct;
          progressPercent.textContent = `${pct}%`;
          progressLabel.textContent = `Mengunggah… (${(loaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`;
        },
        onSuccess: (result) => {
          progressWrap.hidden = true;
          Notif.show({ type: 'success', title: 'Postingan berhasil disimpan', subtitle: result.url });
          generatedForm.reset();
        },
        onError: (err) => {
          progressWrap.hidden = true;
          Notif.show({ type: 'error', title: 'Gagal menyimpan', subtitle: err.message });
        },
      });
    },
    onReset: () => {
      console.log('[explorer/news] form direset');
    },
  });
}
