/*
 * Hub modul "news" (Postingan) — titik penghubung tunggal antar sub-view
 * dokumen ini. Dipanggil oleh ../index.js (renderDocForView) via
 * import('./news/index.js'), yang mengambil renderTabel/renderForm dari sini
 * alih-alih import langsung ke tabel.js/form.js.
 *
 * Kalau news nanti butuh komponen lain (mis. preview publish, chart statistik
 * baca), tambahkan file barunya di folder ini, re-export render-nya di sini
 * (mis. `export { render as renderChart } from './chart.js'`), lalu daftarkan
 * tombolnya sendiri lewat MENU di bawah — root explorer/index.js membaca
 * MENU ini untuk membangun kartu gateway, tidak hardcode tombol per dokumen.
 *
 * icon & appearance tiap entry MENU didefinisikan DI SINI (bukan default
 * statis di root explorer/index.js) — modul news sendiri yang menentukan
 * ikon dan gaya tombolnya. Root hanya fallback ke 2 tombol default polos
 * kalau modul BELUM export MENU sama sekali (lihat DEFAULT_MENU di sana).
 *
 * `icon` adalah NAMA DASAR Fluent System Icons (font resmi Microsoft, sudah
 * aktif lewat assets/modules/icons/fluent/index.css — lihat catatan.md
 * §7-13), BUKAN lagi Material Symbols, dan BUKAN import data-URI dari
 * Icon.js.
 *
 * CONFIG (lebar form, dll) re-export dari ./config.js — file TERPISAH (bukan
 * didefinisikan di sini) supaya form.js/tabel.js bisa mengimpor CONFIG tanpa
 * circular import (index.js ini sendiri meng-export ulang render dari mereka).
 */
export { CONFIG } from './config.js';

export { render as renderTabel } from './tabel.js';
export { render as renderForm } from './form.js';
export { render as renderEdit } from './edit.js';
export { render as renderSetting } from './setting.js';

export const MENU = [
  { view: 'table', label: 'Lihat Tabel', appearance: 'stealth', icon: 'table' },
  { view: 'form', label: 'Tulis', appearance: 'stealth', icon: 'add' },
  { view: 'setting', label: '', appearance: 'stealth', icon: 'settings' },
];
