/*
 * Tampilan tabel dokumen "news" (Postingan) — dipanggil oleh ../index.js
 * (renderDocForView) lewat hub news/index.js, menerima `data` (hasil
 * NxStorage('news')) yang sudah di-fetch di sana (tidak perlu fetch ulang).
 *
 * File ini BERDIRI SENDIRI (bukan import balik dari ../index.js) — sengaja
 * mulai sebagai salinan logic generik (tableBuilder.js + columnsFromSchema),
 * lalu disesuaikan KHUSUS untuk news: filter berdasarkan "categori" (bukan
 * "tahun" seperti ipkd/mscp — field itu tidak ada di skema news).
 *
 * formatCell WAJIB kirim eksplisit di sini karena kolom "detail" bertipe
 * richtext (lihat storage/news.json + templates/fluent/RichTextArea.js) —
 * isinya HTML mentah. tableBuilder.js (defaultFormatCell) TIDAK meng-escape
 * HTML sama sekali (raw value langsung ke innerHTML sel) — tanpa formatCell
 * di sini, isi artikel akan dirender sebagai markup, bukan teks (celah
 * stored-XSS lewat konten sendiri). Kolom detail karena itu ditampilkan
 * sebagai teks polos ringkas (tag di-strip + dipotong), bukan HTML utuh.
 *
 * renderEditForm diteruskan ke mountGeneratedTable() dari ./edit.js — supaya
 * tampilan mode EDIT (aksi "Ubah") dikelola file sendiri (konsisten dengan
 * form.js/tabel.js), bukan fallback generik tableBuilder.js. Modul ini bisa
 * dikustomisasi bebas kalau nanti butuh field/layout/validasi berbeda saat edit.
 *
 * pageContainer = `container` param render() INI SENDIRI (bukan `host` anaknya)
 * — diteruskan supaya edit.js bisa menimpa SELURUH halaman (termasuk <h2> judul
 * di atas, bukan cuma host) saat masuk mode edit, sepenuhnya independen secara
 * visual dari tampilan tabel. rerenderPage = self-reference ke render() ini
 * sendiri — dipanggil ctx.backToTable() (dari edit.js) untuk membangun ulang
 * <h2>+host dari nol, karena pageContainer sudah ditimpa habis oleh edit.js.
 */

/** Strip tag HTML dan potong ke panjang tertentu — preview aman untuk kolom "detail" di tabel. */
function plainTextPreview(html, maxLength = 80) {
  const text = String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return escapeHtml(text);
  return escapeHtml(text.slice(0, maxLength)) + '…';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function render(container, data) {
  const { mountGeneratedTable, columnsFromSchema } = await import('../../../helper/tableBuilder.js');
  const { render: renderEdit } = await import('./edit.js');
  await window.NX.defineFluent(['fluentCard']);

  if (!data?.production) {
    container.innerHTML = `
      <div style="padding: 24px;">
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Postingan</h2>
        <fluent-card style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Skema tabel (storage/news.json → production) tidak ditemukan.</p>
        </fluent-card>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || 'Postingan'}</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">${data.deskripsi || ''}</p>
      <div id="nx-generated-table-host"></div>
    </div>
  `;

  const host = container.querySelector('#nx-generated-table-host');
  const columns = columnsFromSchema(data);

  await mountGeneratedTable(host, {
    source: data,
    columns,
    pageSize: 10,
    filterField: 'categori',
    renderEditForm: renderEdit,
    pageContainer: container,
    rerenderPage: () => render(container, data),
    actions: { view: true, edit: true, delete: true },
    onAction: (action, row) => {
      console.log('[explorer/news] row action:', action, row);
    },
    formatCell: (value, key) => {
      if (key === 'detail') return plainTextPreview(value);
      if (value == null) return '';
      if (typeof value === 'object') return escapeHtml(JSON.stringify(value));
      return escapeHtml(String(value));
    },
    export: {
      enabled: true,
      types: ['csv', 'json', 'xlsx', 'pdf'],
      fileName: 'postingan',
    },
  });
}
