/*
 * Tampilan tabel dokumen "Posdip" — dipanggil oleh ../index.js (renderDocForView)
 * lewat import('./Posdip/tabel.js'), menerima `data` (hasil NxStorage('Posdip'))
 * yang sudah di-fetch di sana (tidak perlu fetch ulang di sini).
 *
 * File ini BERDIRI SENDIRI (bukan import balik dari ../index.js) — sengaja
 * mulai sebagai salinan logic generik (tableBuilder.js + columnsFromSchema),
 * supaya bisa diubah bebas kapan saja KHUSUS untuk Posdip (kolom, aksi, format
 * sel, filter, dll) tanpa menyentuh mscp atau dokumen lain sama sekali.
 *
 * renderEditForm diteruskan ke mountGeneratedTable() dari ./edit.js — supaya
 * tampilan mode EDIT (aksi "Ubah") dikelola file sendiri (konsisten dengan
 * form.js/tabel.js), bukan fallback generik tableBuilder.js.
 *
 * pageContainer = `container` param render() INI SENDIRI (bukan `host` anaknya)
 * — diteruskan supaya edit.js bisa menimpa SELURUH halaman (termasuk <h2> judul
 * di atas, bukan cuma host) saat masuk mode edit, sepenuhnya independen secara
 * visual dari tampilan tabel. rerenderPage = self-reference ke render() ini
 * sendiri — dipanggil ctx.backToTable() (dari edit.js) untuk membangun ulang
 * <h2>+host dari nol, karena pageContainer sudah ditimpa habis oleh edit.js.
 */

export async function render(container, data) {
  const { mountGeneratedTable, columnsFromSchema } = await import('../../../helper/tableBuilder.js');
  const { render: renderEdit } = await import('./edit.js');
  await window.NX.defineFluent(['fluentCard']);

  if (!data?.production) {
    container.innerHTML = `
      <div style="padding: 24px;">
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Posdip</h2>
        <fluent-card style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Skema tabel (storage/Posdip.json → production) tidak ditemukan.</p>
        </fluent-card>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">${data.appname || 'Posdip'}</h2>
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
    filterField: 'tahun',
    renderEditForm: renderEdit,
    pageContainer: container,
    rerenderPage: () => render(container, data),
    actions: { view: true, edit: true, delete: true },
    onAction: (action, row) => {
      console.log('[explorer/Posdip] row action:', action, row);
    },
    export: {
      enabled: true,
      types: ['csv', 'json', 'xlsx', 'pdf'],
      fileName: 'Posdip',
    },
  });
}
