/*
 * Konfigurasi bersama modul "galeri" — dipisah dari index.js supaya form.js dan
 * tabel.js bisa mengimpornya TANPA circular import (index.js sendiri
 * meng-export ulang render dari form.js/tabel.js).
 *
 * formMaxWidth: satu sumber lebar FORM untuk modul ini — dipakai form.js
 * (tambah data) DAN edit.js (form edit, dipanggil dari tabel.js lewat aksi
 * "Ubah"). Ubah nilai di SINI SAJA supaya form tambah & form edit selalu
 * konsisten lebarnya. Tidak memengaruhi lebar TABEL itu sendiri.
 */
export const CONFIG = {
  formMaxWidth: '560px',
};
