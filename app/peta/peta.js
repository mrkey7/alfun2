(() => {
  "use strict";
  if (window.alfiyyahPeta) return;

  const pembuat = new Map();
  let terakhir = null;
  const JUMLAH_BAGIAN = 4;
  const positif = n => Math.max(1, Number(n) || 1);
  const bekukan = value => {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(bekukan);
    return Object.freeze(value);
  };

  function ukuranInduk() {
    const root = document.documentElement;
    const width = positif(root.clientWidth || window.innerWidth);
    return {
      left: 0, top: 0,
      width,
      height: positif(root.clientHeight || window.innerHeight),
      jumlahBagian: JUMLAH_BAGIAN,
      lebarBagian: width / JUMLAH_BAGIAN
    };
  }

  // Peta turunan menyebutkan induknya secara eksplisit.
  // petaG terdiri dari empat bagian internal, bukan grid visual.
  // petaS mengambil satu bagian penuh atau setengah bagian dari sisi kiri.
  pembuat.set("petaS", ({ petaG, sidebarOpen, sidebarScale, sidebarScrollbarWidth = 0 }) => {
    const lebarAsli = petaG.lebarBagian;
    const scale = sidebarScale === 0.5 ? 0.5 : 1;
    return {
      parent: "petaG", left: petaG.left, top: petaG.top,
      lebarAsli, scale, scrollbarWidth: sidebarOpen ? Math.max(0, Number(sidebarScrollbarWidth) || 0) : 0,
      width: sidebarOpen ? lebarAsli * scale : 0,
      height: petaG.height
    };
  });

  // petaP mengambil seluruh sisa petaG di sebelah kanan petaS.
  // Saat petaS menyempit, area yang dilepas otomatis menjadi bagian petaP.
  pembuat.set("petaP", ({ petaG, petaS }) => {
    const width = petaG.width - petaS.width;
    return {
      parent: "petaG",
      left: petaG.left + petaS.width,
      top: petaG.top,
      width,
      height: petaG.height,
      // Skala tunggal PetaP diwariskan apa adanya oleh seluruh peta turunannya.
      scale: width / petaG.width
    };
  });

  pembuat.set("petaH", ({ petaP, page }) =>
    page === "sampul" ? { ...petaP, parent: "petaP" } : null
  );
  pembuat.set("petaB", ({ petaP, page }) =>
    page === "bait" || page === "kalibrasi"
      ? { ...petaP, parent: "petaP" } : null
  );
  pembuat.set("petaK", ({ petaP, page }) =>
    page === "kuis" ? { ...petaP, parent: "petaP" } : null
  );

  function hitung({ sidebarOpen = false, sidebarScale = 1, sidebarScrollbarWidth = 0, page = "sampul" } = {}) {
    const petaG = ukuranInduk();
    const hasil = { petaG };
    const konteks = { petaG, sidebarOpen: Boolean(sidebarOpen), sidebarScale: sidebarScale === 0.5 ? 0.5 : 1, sidebarScrollbarWidth: Math.max(0, Number(sidebarScrollbarWidth) || 0), page };
    for (const [nama, buat] of pembuat) {
      const nilai = buat({ ...konteks, ...hasil });
      if (nilai != null) hasil[nama] = nilai;
    }
    terakhir = bekukan(hasil);
    window.__alfiyyahPeta = terakhir;
    return terakhir;
  }

  function daftarkan(nama, buat) {
    if (!/^peta[A-Z0-9][A-Za-z0-9]*$/.test(nama))
      throw new TypeError("Nama peta harus diawali 'peta' dan menggunakan camelCase.");
    if (pembuat.has(nama)) throw new Error(`Nama ${nama} sudah digunakan.`);
    if (typeof buat !== "function") throw new TypeError("Pembuat peta harus berupa fungsi.");
    pembuat.set(nama, buat);
    return () => pembuat.delete(nama);
  }

  window.alfiyyahPeta = Object.freeze({
    hitung, daftarkan,
    baca: () => terakhir || hitung(),
    ukuranInduk
  });
})();
