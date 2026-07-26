/*
 * Tampilan form EDIT dokumen "Posdip" — dipanggil oleh
 * templates/helper/tableBuilder.js#showEditForm() lewat options.renderEditForm
 * (diteruskan dari tabel.js sebagai options.pageContainer/rerenderPage), saat
 * user klik aksi "Ubah" pada baris tabel.
 *
 * File ini BERDIRI SENDIRI dari form.js (tambah data) DAN dari tabel.js —
 * sengaja render ULANG SELURUH halaman dari nol di sini (padding, judul,
 * wrapper max-width), BUKAN cuma isi host di dalam tabel.js. Alasan: kalau
 * cuma mengisi host anak tabel.js, judul <h2> milik tabel.js tetap nempel di
 * atas (full-width, tidak ikut CONFIG.formMaxWidth), sementara form di
 * bawahnya dibatasi lebar tertentu — dua elemen dengan lebar beda dalam satu
 * tampilan, terlihat tidak menyatu. Dengan render ulang penuh di sini, mode
 * edit BENAR-BENAR independen secara visual dari tabel.
 *
 * Kontrak: export async function render(pageContainer, data, row, ctx)
 *   pageContainer - container ASLI level halaman (options.pageContainer dari
 *                   tabel.js, BUKAN host tempat grid tabel dirender) — bebas
 *                   ditimpa penuh di sini.
 *   data          - hasil NxStorage('Posdip') (skema production)
 *   row           - baris yang sedang diedit (nilai lama, dari server)
 *   ctx           - helper dari tableBuilder.js:
 *     ctx.fileFieldNames        Set<string> nama field type:"file" (mis. "file_path")
 *     ctx.updateRow(values)     kirim update ke server, file field auto di-exclude
 *     ctx.notifySuccess(t, s)   notifikasi sukses
 *     ctx.notifyError(t, s)     notifikasi gagal
 *     ctx.backToTable()         panggil options.rerenderPage() tabel.js (keluar mode edit)
 */

export async function render(pageContainer, data, row, ctx) {
  const { mountGeneratedForm } = await import('../../../helper/formBuilder.js');
  const { CONFIG } = await import('./config.js');
  await window.NX.defineFluent(['fluentButton', 'fluentCard']);

  pageContainer.innerHTML = `
    <div style="padding: 24px; max-width: ${CONFIG.formMaxWidth}; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || 'Posdip'} — Ubah</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">${data.deskripsi || ''}</p>
      <div id="nx-Posdip-edit-form-host"></div>
    </div>
  `;

  const formHost = pageContainer.querySelector('#nx-Posdip-edit-form-host');

  await mountGeneratedForm(formHost, data, {
    values: row,
    optionalFileFields: ctx.fileFieldNames,
    onSubmit: async (values) => {
      try {
        await ctx.updateRow(values);
        ctx.notifySuccess('Data berhasil diubah');
        await ctx.backToTable();
      } catch (err) {
        ctx.notifyError('Gagal menyimpan', err.message);
      }
    },
  });
}
