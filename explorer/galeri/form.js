/*
 * Tampilan form dokumen "galeri" — dipanggil oleh ../index.js (renderDocForView)
 * lewat import('./galeri/form.js'), menerima `data` (hasil NxStorage('galeri'))
 * yang sudah di-fetch di sana (tidak perlu fetch ulang di sini).
 *
 * File ini BERDIRI SENDIRI (bukan import balik dari ../index.js) — sengaja
 * mulai sebagai salinan logic generik (formBuilder.js + NXUI.Storage().cloud()
 * upload), supaya bisa diubah bebas kapan saja KHUSUS untuk galeri (validasi,
 * field tambahan, alur submit, dll) tanpa menyentuh mscp atau dokumen lain.
 *
 * Lebar form (max-width) datang dari CONFIG.formMaxWidth (./config.js) — SATU
 * sumber yang sama dipakai form edit di dalam tabel (lihat tabel.js), supaya
 * form tambah & form edit selalu konsisten. Ubah lebar di config.js, bukan di sini.
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
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">galeri</h2>
        <fluent-card style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Skema form (storage/galeri.json → production) tidak ditemukan.</p>
        </fluent-card>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px; max-width: ${CONFIG.formMaxWidth}; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Explorer</h2>
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

  // Nama field upload DIAMBIL DARI SKEMA (type:"file"), bukan ditulis tangan —
  // di galeri.json namanya "images", bukan "file_path" seperti mscp/ipkd. Versi
  // awal file ini salinan mscp dan masih memakai "file_path", sehingga
  // `values.file_path` selalu undefined dan addBackground() menerima file kosong.
  const uploadField = Object.values(data.production.from || {})
    .find((f) => f && f.type === 'file' && f.forms !== false)?.name;

  const generatedForm = await mountGeneratedForm(formHost, data, {
    onSubmit: (values) => {
      const Notif = new NXUI.Notifikasi({ autoHideDelay: 3000 });

      if (!uploadField) {
        Notif.show({ type: 'error', title: 'Skema tidak punya field upload', subtitle: 'Tidak ada field bertipe "file" di galeri.json' });
        return;
      }

      // Field upload dipisahkan dari values — sisanya (title, pubdate, dst) ikut
      // sebagai kolom tambahan via `field`.
      const { [uploadField]: uploadValue, ...rest } = values;

      progressWrap.hidden = false;
      progressBar.value = 0;
      progressPercent.textContent = '0%';
      progressLabel.textContent = 'Mengunggah…';

      NXUI.Storage().cloud().addBackground({
        tabel: data.production.tabel || 'galeri',
        file: uploadValue,
        userid: window.NEXA.userId,
        fieldupload: uploadField,
        field: rest,
        onProgress: (pct, loaded, total) => {
          progressBar.value = pct;
          progressPercent.textContent = `${pct}%`;
          progressLabel.textContent = `Mengunggah… (${(loaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`;
        },
        onSuccess: (result) => {
          progressWrap.hidden = true;
          Notif.show({ type: 'success', title: 'Data berhasil disimpan', subtitle: result.url });
          generatedForm.reset();
        },
        onError: (err) => {
          progressWrap.hidden = true;
          Notif.show({ type: 'error', title: 'Gagal menyimpan', subtitle: err.message });
        },
      });
    },
    onReset: () => {
      console.log('[explorer/galeri] form direset');
    },
  });
}
