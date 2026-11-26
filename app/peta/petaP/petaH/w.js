"use strict";

/*
 * tampilkan=false melewati Sampul hanya saat masuk normal.
 * ?sampul=1 memaksa Sampul tampil untuk pintasan Admin.
 */
(async () => {
  
  const halamanAwal = document.getElementById("blokSampul");
  if (!halamanAwal) {
    console.error("Elemen #blokSampul tidak ditemukan.");
    return;
  }

  const buat = (tag, className, teks) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (teks !== undefined) el.textContent = teks;
    return el;
  };

  try {
    const config = await APP.loadJSON("rules.utama", { cache: "no-store" });
    const sampul = config?.sampul || {};
    const paksaSampul = new URLSearchParams(window.location.search).get("sampul") === "1";

    if (sampul.tampilkan === false && !paksaSampul) {
      window.location.replace(APP.url("halaman.baitUrl").href);
      return;
    }

    const tautan = buat("a", "sampul");
    tautan.href = APP.url("halaman.baitUrl").href;
    tautan.setAttribute("aria-label", "Selanjutnya ke halaman Bait");
    const ornamenAtas = buat("div", "ornamen", "۞");
    const judul = buat("div", "judul", "أَلْفِيَّةُ ابْنِ مَالِكٍ");
    const pemisah = buat("div", "pemisah");
    pemisah.append(buat("i"), buat("b", "", "✦"), buat("i"));
    const penyusun = buat("div", "penyusun");
    penyusun.append(
      buat("span", "", "نَظْمُ"),
      buat("span", "", "الإِمَامِ مُحَمَّدِ بْنِ عَبْدِ اللهِ بْنِ مَالِكٍ")
    );
    const ornamenBawah = buat("div", "ornamen", "۞");
    tautan.append(ornamenAtas, judul, pemisah, penyusun, ornamenBawah);

    const judulTambah = Number(sampul.judul);
    const penyusunTambah = Number(sampul.penyusun);
    tautan.style.setProperty("--judul-tambah", `${Number.isFinite(judulTambah) ? judulTambah : 0}px`);
    tautan.style.setProperty("--penyusun-tambah", `${Number.isFinite(penyusunTambah) ? penyusunTambah : 0}px`);
    halamanAwal.replaceChildren(tautan);
  } catch (error) {
    console.error("Gagal memuat Sampul:", error);
    halamanAwal.replaceChildren(buat("div", "status error", `Gagal memuat Sampul: ${error.message}`));
  }
})();
