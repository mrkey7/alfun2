(() => {
  "use strict";

  const STORAGE_KEY = "alfiyyah.panel.layout";

  const BATAS = { min:1, max:64 };
  const SKALA = { min:0.1, max:1, step:0.05 };
  let bawaan = null;
  let konfigurasi = null;

  const salin = nilai => JSON.parse(JSON.stringify(nilai));
  const batasi = nilai => Math.max(BATAS.min, Math.min(BATAS.max, Math.floor(Number(nilai) || BATAS.min)));
  const batasiSkala = nilai => Math.max(SKALA.min, Math.min(SKALA.max, Math.round((Number(nilai) || 0.5) / SKALA.step) * SKALA.step));

  const siap = (async () => {
    bawaan = await APP.loadJSON("petaB.layout");
    konfigurasi = salin(bawaan);
    try {
      const tersimpan = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (tersimpan && typeof tersimpan === "object") {
        konfigurasi.grid = { ...konfigurasi.grid, ...(tersimpan.grid || {}) };
        konfigurasi.panel = { ...konfigurasi.panel, ...(tersimpan.panel || {}) };
      }
    } catch {}
    konfigurasi.grid.kolom = batasi(konfigurasi.grid.kolom);
    konfigurasi.grid.baris = batasi(konfigurasi.grid.baris);
    konfigurasi.panel.skalaKonten = batasiSkala(konfigurasi.panel.skalaKonten ?? 0.5);
    terapkan();
    aktifkanKontrasIkonMenu();
    return konfigurasi;
  })();

  function terapkan() {
    if (!konfigurasi) return;
    const root = document.documentElement;
    root.style.setProperty("--panel-grid-columns", String(konfigurasi.grid.kolom));
    root.style.setProperty("--panel-grid-rows", String(konfigurasi.grid.baris));
    root.style.setProperty("--panel-area-rows", String(konfigurasi.panel.baris || 1));
    root.style.setProperty("--panel-skala-konten", String(konfigurasi.panel.skalaKonten));
    const panelArea = document.getElementById("alfiyyahPanelArea");
    if (panelArea) {
      panelArea.style.setProperty(
        "--panel-grid-cell-height",
        `calc(var(--peta-p-grid-height, 768px) / ${konfigurasi.grid.baris})`
      );
    }
    root.dataset.panelGrid = `${konfigurasi.grid.kolom}x${konfigurasi.grid.baris}`;
  }

  function sesuaikanKontrasIkonMenu() {
    const ikon = document.getElementById("tombolMenuUtama");
    if (!ikon || !ikon.isConnected) return;
    const rect = ikon.getBoundingClientRect();
    const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
    const y = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
    const pointer = ikon.style.pointerEvents;
    ikon.style.pointerEvents = "none";
    let node = document.elementFromPoint(x, y);
    ikon.style.pointerEvents = pointer;
    let latar = [255, 255, 255];
    while (node && node !== document.documentElement) {
      const warna = getComputedStyle(node).backgroundColor;
      const rgba = warna.match(/[\d.]+/g)?.map(Number);
      if (rgba && rgba.length >= 3 && (rgba[3] ?? 1) > 0) {
        const alpha = rgba.length > 3 ? rgba[3] : 1;
        latar = rgba.slice(0, 3).map((v, i) => v * alpha + latar[i] * (1 - alpha));
        if (alpha >= 0.98) break;
      }
      node = node.parentElement;
    }
    const linear = latar.map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    const luminansi = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    const gelap = luminansi > 0.179;
    ikon.style.color = gelap ? "#171717" : "#ffffff";
    ikon.style.filter = gelap
      ? "drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff)"
      : "drop-shadow(0 0 1px #000) drop-shadow(0 0 2px #000)";
  }

  let observerKontrasMenu;
  function aktifkanKontrasIkonMenu() {
    const ikon = document.getElementById("tombolMenuUtama");
    if (!ikon) return;
    const perbarui = () => requestAnimationFrame(sesuaikanKontrasIkonMenu);
    perbarui();
    window.addEventListener("resize", perbarui, { passive: true });

    // Amati tema pada root saja. Jangan amati subtree/style ikon sendiri,
    // karena perubahan warna ikon akan memicu observer tanpa henti.
    observerKontrasMenu?.disconnect();
    observerKontrasMenu = new MutationObserver(perbarui);
    observerKontrasMenu.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-tema", "class"]
    });
    observerKontrasMenu.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-tema", "class"]
    });
  }

  window.initPanelLayout = async () => {
    await siap;
    terapkan();
    return salin(konfigurasi);
  };

  window.initPanelSidebar = async ({ container, el }) => {
    await siap;
    container.replaceChildren();

    const catatan = el("p", { class:"as-note" },
      "PetaB mengikuti tinggi konten. Area Panel memiliki tinggi terukur, sedangkan Area Isi berkembang sesuai seluruh isi.");
    const kolom = el("input", { type:"number", min:String(BATAS.min), max:String(BATAS.max), step:"1" });
    const baris = el("input", { type:"number", min:String(BATAS.min), max:String(BATAS.max), step:"1" });
    const skala = el("input", { type:"range", min:String(SKALA.min), max:String(SKALA.max), step:String(SKALA.step) });
    const nilaiSkala = el("output", {});
    kolom.value = String(konfigurasi.grid.kolom);
    baris.value = String(konfigurasi.grid.baris);
    skala.value = String(konfigurasi.panel.skalaKonten);
    nilaiSkala.value = `${Math.round(konfigurasi.panel.skalaKonten * 100)}%`;
    nilaiSkala.textContent = nilaiSkala.value;

    const buatField = (judul, input) => {
      const label = el("label", { class:"as-field" });
      const barisField = el("span");
      barisField.append(el("span", {}, judul));
      label.append(barisField, input);
      return label;
    };

    const status = el("div", { class:"as-status", "aria-live":"polite" });
    const simpan = el("button", { type:"button", class:"as-save" }, "Simpan pengaturan");
    const reset = el("button", { type:"button" }, "Kembalikan bawaan");
    const aksi = el("div", { class:"as-actions" });
    aksi.append(simpan, reset);

    const bacaInput = () => {
      konfigurasi.grid.kolom = batasi(kolom.value);
      konfigurasi.grid.baris = batasi(baris.value);
      kolom.value = String(konfigurasi.grid.kolom);
      baris.value = String(konfigurasi.grid.baris);
      terapkan();
      status.textContent = "Pratinjau diperbarui langsung.";
      status.className = "as-status";
    };

    kolom.addEventListener("input", bacaInput);
    baris.addEventListener("input", bacaInput);
    skala.addEventListener("input", () => {
      konfigurasi.panel.skalaKonten = batasiSkala(skala.value);
      skala.value = String(konfigurasi.panel.skalaKonten);
      nilaiSkala.value = `${Math.round(konfigurasi.panel.skalaKonten * 100)}%`;
      nilaiSkala.textContent = nilaiSkala.value;
      terapkan();
      status.textContent = "Pratinjau ukuran konten diperbarui langsung.";
      status.className = "as-status";
    });
    simpan.addEventListener("click", () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(konfigurasi));
        status.textContent = "Pengaturan tersimpan pada browser ini.";
        status.className = "as-status success";
      } catch (error) {
        status.textContent = `Gagal menyimpan: ${error.message}`;
        status.className = "as-status error";
      }
    });
    reset.addEventListener("click", () => {
      konfigurasi = salin(bawaan);
      kolom.value = String(konfigurasi.grid.kolom);
      baris.value = String(konfigurasi.grid.baris);
      skala.value = String(konfigurasi.panel.skalaKonten);
      nilaiSkala.value = `${Math.round(konfigurasi.panel.skalaKonten * 100)}%`;
      nilaiSkala.textContent = nilaiSkala.value;
      localStorage.removeItem(STORAGE_KEY);
      terapkan();
      status.textContent = "Konfigurasi bawaan dipulihkan.";
      status.className = "as-status success";
    });

    container.append(
      catatan,
      buatField("Jumlah kolom", kolom),
      buatField("Jumlah baris", baris),
      buatField("Ukuran seragam konten Panel", skala),
      nilaiSkala,
      aksi,
      status
    );
  };
})();
