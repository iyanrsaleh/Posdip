/*
 * Konfigurasi bersama modul "news" (Postingan) — dipisah dari index.js supaya
 * form.js dan tabel.js bisa mengimpornya TANPA circular import (index.js sendiri
 * meng-export ulang render dari form.js/tabel.js — kalau CONFIG ada di index.js,
 * form.js/tabel.js yang meng-import balik index.js akan circular).
 *
 * formMaxWidth: satu sumber lebar FORM untuk modul ini — dipakai form.js (tambah
 * data) DAN edit.js (form edit, dipanggil dari tabel.js lewat aksi "Ubah").
 * Ubah nilai di SINI SAJA supaya form tambah & form edit selalu konsisten
 * lebarnya. Tidak memengaruhi lebar TABEL itu sendiri, murni untuk form.
 */
export const CONFIG = {
  formMaxWidth: '960px',
};
