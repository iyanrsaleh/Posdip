/*
 * Setting kategori berita — dipanggil oleh ../index.js (renderDocForView) lewat
 * hub news/index.js (export renderSetting), dipicu tombol MENU { view: 'setting' }
 * di kartu gateway.
 *
 * Kelola daftar kategori yang muncul sebagai pilihan `type:"select"` di field
 * `categori` pada form Insert/Edit Postingan (lihat form.js/edit.js). Daftar
 * ini TERSIMPAN LANGSUNG di storage/news.json sendiri — field
 * `production.from.categori.select.data` — BUKAN file terpisah. Halaman ini
 * baca skema itu lewat NxStorage('news'), ubah array select.data-nya, lalu
 * `.save()` seluruh skema kembali (kontrak NxStorage().save(): REPLACE
 * SELURUH FILE, lihat storage/README.md) — field lain di skema (title,
 * images, dst) ikut ditulis ulang APA ADANYA (tidak diubah), hanya
 * categori.select.data yang berbeda dari sebelumnya.
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Field categori di skema — null kalau skema/field belum ada (JSON rusak/kosong). */
function categoriField(schema) {
  return schema?.production?.from?.categori || null;
}

export async function render(container, data) {
  await window.NX.defineFluent(['fluentCard', 'fluentTextField', 'fluentButton']);

  container.innerHTML = `
    <div style="padding: 24px; max-width: 560px; margin: 0 auto;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Kategori Berita</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Kelola pilihan kategori untuk field "Kategori" pada form Postingan.</p>

      <fluent-card style="padding: 16px; margin-bottom: 16px;">
        <form id="nx-news-category-form" style="display: flex; gap: 8px; align-items: flex-end;">
          <div style="flex: 1 1 auto;">
            <label for="nx-news-category-input" style="display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: var(--beranda-dv-text);">Nama kategori baru</label>
            <fluent-text-field id="nx-news-category-input" placeholder="Mis. Kesehatan" style="width: 100%;" required></fluent-text-field>
          </div>
          <fluent-button type="submit" appearance="accent">Tambah</fluent-button>
        </form>
        <p id="nx-news-category-feedback" style="margin: 8px 0 0; font-size: 13px; display: none;"></p>
      </fluent-card>

      <fluent-card style="padding: 16px;">
        <div id="nx-news-category-list"></div>
      </fluent-card>
    </div>
  `;

  const form = container.querySelector('#nx-news-category-form');
  const input = container.querySelector('#nx-news-category-input');
  const feedback = container.querySelector('#nx-news-category-feedback');
  const listHost = container.querySelector('#nx-news-category-list');

  function showFeedback(message, isError) {
    feedback.textContent = message;
    feedback.style.color = isError ? '#d13438' : '#1a7f37';
    feedback.style.display = '';
  }

  function renderList(options) {
    if (options.length === 0) {
      listHost.innerHTML = `<p style="margin: 0; font-size: 13px; color: var(--beranda-dv-text-muted);">Belum ada kategori.</p>`;
      return;
    }
    listHost.innerHTML = options.map((opt, i) => `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 0; ${i > 0 ? 'border-top: 1px solid var(--beranda-dv-header-border);' : ''}">
        <span style="font-size: 13px; color: var(--beranda-dv-text);">${escapeHtml(opt.label)}</span>
        <fluent-button appearance="stealth" size="small" data-remove-index="${i}">Hapus</fluent-button>
      </div>
    `).join('');
  }

  const field = categoriField(data);
  if (!field) {
    listHost.innerHTML = '';
    showFeedback('Field "categori" tidak ditemukan di storage/news.json — periksa skema.', true);
    form.querySelector('fluent-button[type="submit"]').disabled = true;
    return;
  }

  let options = Array.isArray(field.select?.data) ? [...field.select.data] : [];
  renderList(options);

  /** Simpan seluruh skema `data` (mutasi categori.select.data sudah dilakukan pemanggil) — REPLACE PENUH file news.json. */
  async function persist() {
    field.select = { data: options };
    await NxStorage('news').save(data);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.style.display = 'none';

    const name = input.value?.trim();
    if (!name) {
      showFeedback('Nama kategori wajib diisi.', true);
      return;
    }
    if (options.some((opt) => String(opt.value).toLowerCase() === name.toLowerCase())) {
      showFeedback('Kategori itu sudah ada.', true);
      return;
    }

    const previous = options;
    options = [...options, { label: name, key: name, value: name }];
    try {
      await persist();
      input.value = '';
      renderList(options);
      showFeedback('Kategori berhasil ditambahkan.', false);
    } catch (err) {
      options = previous;
      showFeedback('Gagal menyimpan: ' + err.message, true);
    }
  });

  listHost.addEventListener('click', async (ev) => {
    const btn = ev.target?.closest?.('[data-remove-index]');
    if (!btn) return;
    const index = Number(btn.dataset.removeIndex);
    const previous = options;
    const removed = options[index];
    options = options.filter((_, i) => i !== index);
    try {
      await persist();
      renderList(options);
      showFeedback(`Kategori "${removed.label}" dihapus.`, false);
    } catch (err) {
      options = previous;
      showFeedback('Gagal menghapus: ' + err.message, true);
    }
  });
}
