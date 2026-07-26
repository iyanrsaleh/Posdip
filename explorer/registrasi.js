/*
 * Registrasi dokumen yang tampil di Explorer.
 *
 * Hanya dokumen yang terdaftar di sini yang muncul di halaman gateway Explorer.
 * Kalau user menambahkan storage baru (misal "kepegawaian.json"), storage
 * itu TIDAK akan muncul sampai didaftarkan di file ini + dibuatkan folder
 * kustom di explorer/ (tabel.js + form.js).
 *
 * Format: array of { name, appname, deskripsi }
 *   name      → nama file storage (tanpa .json), juga nama folder di explorer/
 *   appname   → judul yang tampil di kartu
 *   deskripsi → deskripsi singkat di kartu
 */

export const DOKUMEN = [
  // {
  //   name: 'ipkd',
  //   appname: 'IPKD',
  //   deskripsi: 'Indeks Pengelolaan Keuangan Daerah',
  // },
  // {
  //   name: 'mscp',
  //   appname: 'MSCP',
  //   deskripsi: 'Monitoring, Controlling, Surveillance for Prevention',
  // },
 {
    name: 'Posdip',
    appname: 'Posdip',
    deskripsi: 'Portal Satu Data Indonesia Pohuwato',
  },
  {
    name: 'news',
    appname: 'Postingan',
    deskripsi: 'Artikel & berita',
  },

  // {
  //   name: 'Agenda',
  //   appname: 'Agenda',
  //   deskripsi: 'Catat jadwal kegiatan dan acara resmi',
  // },
  {
    name: 'galeri',
    appname: 'Galeri',
    deskripsi: 'Kelola koleksi gambar galeri ',
  }
];
