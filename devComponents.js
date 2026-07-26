/*
 * Rute: dev_components (INTERNAL — bukan bagian dari Extension, hanya untuk
 * developer melihat daftar komponen Fluent UI Web Components yang tersedia
 * di project ini).
 * Terdaftar di routing.js (action: 'dev_components').
 *
 * Menggunakan ULANG daftar COMPONENTS dari templates/fluent_demo.js.
 *
 * PENTING — kenapa TIDAK link ke /fluent/{Name}: window.nexaRoute (NexaRoute
 * global app) SELALU merender ke container #main (lihat App.js containerId),
 * BUKAN ke panel Extension ini (#nx-source-panel, lihat templates/source.js).
 * Navigasi ke /fluent/{Name} dari sini akan merender halaman komponen ke
 * #main yang tersembunyi di belakang shell Extension — kelihatan "tidak ada
 * hasil" walau sebenarnya berhasil dirender (cuma di tempat yang salah).
 * Begitu juga tombol "Kembali" di tiap halaman fluent/{Name}.js (balik ke
 * /fluent_demo) — sama-sama merender ke #main, bukan ke panel ini.
 *
 * Solusi: render PREVIEW tiap komponen LANGSUNG di dalam panel Extension ini,
 * pakai ULANG handler asli dari templates/fluent/{Name}.js (kontraknya:
 * export async function fluent_{Name}(page, route) { route.register(page,
 * async (routeName, container, ...) => {...konten asli...}) }) — panggil
 * fungsi itu dengan objek `route` TIRUAN yang cuma menangkap handler-nya
 * (lihat captureRouteHandler), lalu panggil handler tsb manual dengan
 * container milik panel ini. Tidak pernah menyentuh window.nexaRoute sama
 * sekali, jadi tidak ada masalah container.
 */

/**
 * Objek `route` tiruan untuk menangkap handler dari export fluent_{Name}(page, route)
 * TANPA mendaftar ke window.nexaRoute — cukup implementasikan method yang
 * dipakai badan handler (route.register, route.routeMetaByRoute.set).
 */
function captureRouteHandler() {
  let captured = null;
  const fakeRoute = {
    register(page, handler) {
      captured = handler;
    },
    routeMetaByRoute: { set() {} },
  };
  return { fakeRoute, getHandler: () => captured };
}

async function renderComponentPreview(container, name) {
  container.innerHTML = `<p style="padding: 24px; color: var(--beranda-dv-text-muted); font-size: 13px;">Memuat komponen…</p>`;
  try {
    const mod = await import(`../fluent/${name}.js`);
    const exportName = `fluent_${name}`;
    const fn = mod[exportName] || mod.default;
    if (typeof fn !== 'function') {
      container.innerHTML = `<p style="padding: 24px; color: var(--beranda-dv-text-muted); font-size: 13px;">Export "${exportName}" tidak ditemukan di templates/fluent/${name}.js.</p>`;
      return;
    }
    const { fakeRoute, getHandler } = captureRouteHandler();
    await fn(`fluent/${name}`, fakeRoute);
    const handler = getHandler();
    if (typeof handler !== 'function') {
      container.innerHTML = `<p style="padding: 24px; color: var(--beranda-dv-text-muted); font-size: 13px;">Komponen ${name} tidak mendaftarkan handler.</p>`;
      return;
    }
    await handler(`fluent/${name}`, container, undefined, null, {});
    // Link "← Kembali ke daftar komponen" bawaan tiap fluent/{Name}.js menunjuk
    // /fluent_demo (route top-level, salah konteks di sini) — ganti jadi tombol
    // balik ke daftar dalam panel ini sendiri.
    const backLink = container.querySelector('.nx-page__nav a[href="/fluent_demo"]');
    if (backLink) {
      backLink.textContent = '← Kembali ke daftar komponen';
      backLink.removeAttribute('href');
      backLink.style.cursor = 'pointer';
      backLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        renderComponentList(container);
      });
    }
  } catch (err) {
    console.error(`[devComponents] gagal memuat templates/fluent/${name}.js:`, err);
    container.innerHTML = `<p style="padding: 24px; color: var(--beranda-dv-text-muted); font-size: 13px;">Gagal memuat komponen ${name}: ${err?.message || err}</p>`;
  }
}

async function renderComponentList(root) {
  const { COMPONENTS } = await import('../fluent_demo.js');
  await window.NX.defineFluent(['fluentCard']);

  root.innerHTML = `
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: var(--beranda-dv-text);">Fluent UI Web Components</h2>
      <p style="margin: 0 0 20px 0; color: var(--beranda-dv-text-muted);">Komponen native custom elements mengikuti bahasa desain Fluent 2 (Windows 11 Settings, File Explorer). ${COMPONENTS.length} komponen tersedia — pilih untuk melihat contoh dan kode-nya.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;">
        ${COMPONENTS.map((c) => `
          <fluent-card data-component-name="${c.name}" style="padding: 12px; cursor: pointer;">
            <span style="font-size: 14px; font-weight: 600; color: var(--beranda-dv-accent, #0f6cbd);">${c.name}</span>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: var(--beranda-dv-text-muted);">${c.desc}</p>
          </fluent-card>
        `).join('')}
      </div>
    </div>
  `;

  root.querySelectorAll('[data-component-name]').forEach((card) => {
    card.addEventListener('click', () => renderComponentPreview(root, card.dataset.componentName));
  });
}

export async function render(container) {
  await renderComponentList(container);
}
