/**
 * Template Developer Extension
 *
 * Cukup export default — framework yang handle registrasi.
 * Tidak perlu import registerDeveloperView.
 *
 * Dynamic import dengan cache-busting otomatis aktif saat Posdip Mode
 * (nx-dev-watch-path tersimpan di localStorage). Di luar Dev Mode, modul
 * diambil dari cache browser seperti biasa — tidak ada overhead tambahan.
 */

export default {
  label: 'Posdip',
  description: 'v1.0.0 · Studio Style',
  icon: 'folder-src',
  iconType: 'file',

  async render(container) {
    const bust = localStorage.getItem('nx-dev-watch-path') ? '?v=' + Date.now() : '';
    const { renderSidebar } = await import('./sidebar.js' + bust);
    renderSidebar(container, this.id);

    let title = this.label;
    try {
      const res = await fetch('/templates/Posdip/package.json');
      if (res.ok) {
        const pkg = await res.json();
        if (pkg.title) title = pkg.title;
      }
    } catch {
      // fallback ke this.label
    }
    NXUI.id("nxtitlebar__title").html(title);
  },

  async renderTab(container, config) {
    const bust = localStorage.getItem('nx-dev-watch-path') ? '?v=' + Date.now() : '';
    const { renderPanel } = await import('./panel.js' + bust);
    renderPanel(container, config);
  },
};
