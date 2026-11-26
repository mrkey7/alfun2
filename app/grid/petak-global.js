(() => {
  "use strict";
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = APP.url("sidebar.petakGlobal.css").href;
  document.head.append(css);

  window.initPetakGlobal = ({ generalSection, el, a1Default = {} }) => {
    const heading = el("h3", { class: "as-section-title" }, "Pengaturan Grid");
    const toggleLabel = el("label", { class: "as-check" });
    const toggle = el("input", { type: "checkbox", id: "pengaturanPetak" });
    toggleLabel.append(toggle, el("span", {}, "Grid"));
    const toggleRow = el("div", { class:"as-grid-toggle-row" });
    const outerLabel = el("label", { class:"as-check" });
    const outerToggle = el("input", { type:"checkbox", id:"gridGarisLuar" });
    outerLabel.append(outerToggle, el("span", {}, "Luar ++")); 
    toggleRow.append(toggleLabel, outerLabel);

    const makeNumber = (label, id, min, max, value) => {
      const wrap = el("label", { class: "as-field" });
      const line = el("span");
      line.append(el("span", {}, label));
      const input = el("input", { type: "number", id, min: String(min), max: String(max), step: "1" });
      input.value = String(value);
      input.addEventListener("input", () => {
        const n = Math.max(min, Math.min(max, Math.floor(Number(input.value) || min)));
        render();
        simpan();
      });
      wrap.append(line, input);
      return { wrap, input };
    };

    let config = { aktif:false, kolom:4, baris:4, kunciPosisi:false, tebalLuar:false };
    try {
      const saved = JSON.parse(localStorage.getItem("alfiyyah.grid.config") || "null");
      if (saved && typeof saved === "object") config = { ...config, ...saved };
    } catch {}
    // Posisi ikon mengikuti jumlah kolom dan baris grid aktif.
    const cols = makeNumber("Jumlah kolom", "gridKolom", 1, 64, config.kolom);
    const rows = makeNumber("Jumlah baris", "gridBaris", 1, 64, config.baris);
    const picker = el("div", { class:"as-grid-picker" });
    const pickerLabel = el("div", { class:"as-grid-picker-label" }, "Sisipkan Grid");
    config.target = config.target === "K" ? "P" : config.target;
    config.target = ["G","S","P"].includes(config.target) ? config.target : "G";
    const pickerStatus = el("div", { class:"as-grid-picker-status", "aria-live":"polite" }, `${config.kolom} × ${config.baris}`);
    const targetPicker = el("div", { class:"as-grid-target", role:"group", "aria-label":"Terapkan grid pada peta" });
    const targetNames = { G:"Global", S:"Sidebar", P:"Pages" };
    const targetButtons = {};
    Object.entries(targetNames).forEach(([key,label]) => {
      const btn = el("button", { type:"button", class:"as-grid-target-button", "aria-label":label, title:label }, key);
      btn.addEventListener("click", () => {
        config.target = key;
        localStorage.setItem("alfiyyah.grid.config", JSON.stringify(config));
        render();
      });
      targetButtons[key] = btn;
      targetPicker.append(btn);
    });
    const pickerMatrix = el("div", { class:"as-grid-picker-matrix", role:"group", "aria-label":"Pilih jumlah kolom dan baris" });
    const pickerCells = [];
    for (let baris = 1; baris <= 10; baris++) {
      for (let kolom = 1; kolom <= 10; kolom++) {
        const cell = el("button", {
          type:"button",
          class:"as-grid-picker-cell",
          "aria-label":`${kolom} kolom × ${baris} baris`,
          title:`${kolom} kolom × ${baris} baris`
        });
        cell.addEventListener("mouseenter", () => previewPicker(kolom, baris));
        cell.addEventListener("focus", () => previewPicker(kolom, baris));
        cell.addEventListener("click", () => applyPicker(kolom, baris));
        pickerMatrix.append(cell);
        pickerCells.push({ cell, kolom, baris });
      }
    }
    const pickerBody = el("div", { class:"as-grid-picker-body" });
    const pickerControls = el("div", { class:"as-grid-picker-controls" });
    pickerControls.append(cols.wrap, rows.wrap, pickerStatus, targetPicker);
    pickerBody.append(pickerMatrix, pickerControls);
    picker.append(pickerLabel, pickerBody);
    const overlay = el("div", { id: "alfiyyahPetakOverlay", "aria-hidden": "true" });
    const previewOverlay = el("div", { id: "alfiyyahPetakPreviewOverlay", "aria-hidden": "true" });
    // Ikon Sidebar dibuat oleh modul global agar tersedia pada setiap halaman.
    const ikonSidebarA1 = el("button", {
      id:"ikonSidebarGlobalA1", type:"button",
      "aria-label":"Buka atau tutup sidebar", title:"Buka atau tutup sidebar"
    });
    ikonSidebarA1.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path></svg>';
    const ikonGridA1 = el("button", {
      id:"ikonGridA1", type:"button",
      "aria-label":"Buka atau tutup tool Grid", title:"Tool Grid"
    });
    ikonGridA1.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"></rect><path d="M3 9h18M3 15h18M9 3v18M15 3v18"></path></svg>';
    const ikonX = ikonGridA1.cloneNode(true);
    ikonX.id = "ikonX";
    ikonX.setAttribute("aria-label", "X");
    ikonX.title = "X";
    const ikonDebugA1 = el("button", {
      id:"ikonDebugA1", type:"button",
      "aria-label":"Mode Debug", title:"Mode Debug"
    });
    ikonDebugA1.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8 6 6M16 8l2-2M8 16l-2 2M16 16l2 2M5 12H2M22 12h-3M12 5V2M12 22v-3"></path><rect x="7" y="7" width="10" height="10" rx="4"></rect><path d="M9 11h6M9 14h6"></path></svg>';
    [ikonGridA1,ikonDebugA1,ikonX].forEach(ikon => Object.assign(ikon.style, {
      position:"fixed", zIndex:"2147483647", width:"28px", height:"28px",
      display:"none", alignItems:"center", justifyContent:"center",
      padding:"0", border:"0", borderRadius:"6px",
      background:"transparent", color:"#55452d", cursor:"pointer",
      transform:"translate(-50%, -50%)"
    }));
    ikonSidebarA1.addEventListener("click", () => window.alfiyyahToggleSidebarOpen?.());
    ikonGridA1.addEventListener("click", () => window.alfiyyahToggleGridTool?.());
    document.body.append(overlay, previewOverlay, ikonSidebarA1, ikonGridA1, ikonDebugA1, ikonX);
    function renderIkonDinamis(peta) {
      if (!peta?.petaS || !window.A1Layout) return;
      const sidebarTerbuka = document.body.classList.contains("alfiyyah-sidebar-open");
      const dasar = {
        ...a1Default, peta:"S", kolom:10, baris:20,
        ukuran:{ ...a1Default.ukuran, mode:"tetap", lebar:28, tinggi:28 }
      };
      const pasang = (ikon, target, tampil) => {
        if (tampil) {
          const layout = window.A1Layout.posisi({ ...dasar, target }, peta);
          window.A1Layout.terapkan(ikon, layout);
          ikon.style.display = "flex";
          ikon.style.zIndex = "2147483647";
        } else ikon.style.display = "none";
      };
      // Ikon Sidebar menjadi pintu masuk dan mengikuti koordinat J1.
      pasang(ikonSidebarA1, "J1", true);
      // Debug mengikuti persis aturan tampil ikon Grid: hanya saat Sidebar terbuka.
      pasang(ikonDebugA1, "H1", sidebarTerbuka);
      pasang(ikonGridA1, "I1", sidebarTerbuka);
    }

    // Menu global baru: ikon di B1, panel utama dan submenu berdempetan.
    const menuGlobalBaru = document.createElement("div");
    menuGlobalBaru.id = "alfiyyahMenuPetaBaru";
    const isiMenuBaru = document.createElement("div");
    isiMenuBaru.className = "menu-peta-baru-isi";
    isiMenuBaru.hidden = true;
    menuGlobalBaru.append(isiMenuBaru);

    // Wadah menu mengikuti elemen konten dari peta aktif:
    // Home berada pada PetaH (#blokSampul), Bait pada PetaB (#daftarBait).
    function perbaruiIndukMenuBaru() {
      const indukPeta = halamanMenuAktif() === "bait"
        ? document.getElementById("daftarBait")
        : document.getElementById("blokSampul");
      if (indukPeta && menuGlobalBaru.parentElement !== indukPeta) {
        indukPeta.append(menuGlobalBaru);
      }
    }

    let tombolMenuLama = null;
    let posisiIkonMenuLama = null;

    const halamanMenuAktif = () => {
      const p = window.APP_PAGE || window.APP?.page || (typeof APP !== "undefined" ? APP.page : "");
      return p === "bait" || p === "petaB" ? "bait" : "home";
    };

    function perbaruiIsiMenuBaru() {
      const bait = halamanMenuAktif() === "bait";
      if (!bait) return;
      tombolMenuLama = document.getElementById("tombolMenuUtama");
      if (tombolMenuLama) {
        const rect = tombolMenuLama.getBoundingClientRect();
        posisiIkonMenuLama = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        tombolMenuLama.style.visibility = "hidden";
        tombolMenuLama.style.pointerEvents = "none";
      }
      // Panel dan submenu baru tidak dibuat. Menu lama tetap menjadi pemilik submenu.
    }

    function bukaMenuBaru() {
      perbaruiIsiMenuBaru();
      tombolMenuLama?.click();
    }
    function jadwalkanTutupMenuBaru() {}

    ikonX.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"></path></svg>';
    ikonX.setAttribute("aria-label", "Menu");
    ikonX.removeAttribute("title");
    ikonX.setAttribute("aria-haspopup", "true");
    ikonX.setAttribute("aria-expanded", "false");
    ikonX.addEventListener("click", () => {
      perbaruiIsiMenuBaru();
      if (tombolMenuLama) tombolMenuLama.click();
      ikonX.setAttribute("aria-expanded", String(tombolMenuLama?.getAttribute("aria-expanded") === "true"));
    });

    // Pilih warna ikon berdasarkan warna latar tepat di belakangnya.
    const sesuaikanKontrasIkon = ikon => {
      const rect = ikon.getBoundingClientRect();
      const x = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
      const y = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
      const pointer = ikon.style.pointerEvents;
      ikon.style.pointerEvents = "none";
      let node = document.elementFromPoint(x, y);
      ikon.style.pointerEvents = pointer;
      let latar = [255,255,255];
      while (node && node !== document.documentElement) {
        const warna = getComputedStyle(node).backgroundColor;
        const rgba = warna.match(/[\d.]+/g)?.map(Number);
        if (rgba && rgba.length >= 3 && (rgba[3] ?? 1) > 0) {
          const alpha = rgba.length > 3 ? rgba[3] : 1;
          latar = rgba.slice(0,3).map((v,i) => v * alpha + latar[i] * (1-alpha));
          if (alpha >= 0.98) break;
        }
        node = node.parentElement;
      }
      const linear = latar.map(v => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      const luminansi = 0.2126*linear[0] + 0.7152*linear[1] + 0.0722*linear[2];
      const gelap = luminansi > 0.179;
      ikon.style.color = gelap ? "#171717" : "#ffffff";
      ikon.style.filter = gelap
        ? "drop-shadow(0 0 1px #fff) drop-shadow(0 0 2px #fff)"
        : "drop-shadow(0 0 1px #000) drop-shadow(0 0 2px #000)";
    };
    generalSection.append(heading, toggleRow, picker);
    outerToggle.checked = Boolean(config.tebalLuar);

    toggle.checked = Boolean(config.aktif);
    const renderPicker = (kolom=config.kolom, baris=config.baris) => {
      pickerStatus.textContent = `${kolom} × ${baris}`;
      pickerCells.forEach(item => {
        item.cell.classList.toggle("is-preview", item.kolom <= kolom && item.baris <= baris);
        item.cell.classList.toggle("is-current", item.kolom <= config.kolom && item.baris <= config.baris);
      });
    };
    let pickerPreviewAktif = false;
    let petaTerakhir = window.alfiyyahPeta.baca();
    const previewPicker = (kolom, baris) => {
      pickerPreviewAktif = true;
      overlay.classList.remove("aktif");
      previewOverlay.classList.add("aktif");
      previewOverlay.dataset.kolom = String(kolom);
      previewOverlay.dataset.baris = String(baris);
      render(petaTerakhir, previewOverlay);
      renderPicker(kolom, baris);
    };
    const resetPickerPreview = () => {
      pickerPreviewAktif = false;
      previewOverlay.classList.remove("aktif");
      render(petaTerakhir);
      renderPicker();
    };
    const applyPicker = (kolom, baris) => {
      config.kolom = kolom;
      config.baris = baris;
      cols.input.value = String(kolom);
      rows.input.value = String(baris);
      simpan();
      renderPicker();
    };
    pickerMatrix.addEventListener("mouseleave", resetPickerPreview);
    pickerMatrix.addEventListener("focusout", event => {
      if (!pickerMatrix.contains(event.relatedTarget)) resetPickerPreview();
    });
    const render = (peta=petaTerakhir, targetOverlay=overlay) => {
      petaTerakhir = peta || window.alfiyyahPeta.baca();
      const scope = config.target;
      const area = scope === "S"
        ? petaTerakhir.petaS
        : scope === "P"
          ? petaTerakhir.petaP
          : petaTerakhir.petaG;
      const visible = Boolean(config.aktif) || targetOverlay === previewOverlay;
      targetOverlay.style.setProperty("--grid-outline-width", config.tebalLuar ? "2px" : "1px");
      // Untuk petaS, seluruh geometri dihitung dari ukuran normal,
      // lalu diskalakan utuh mengikuti mode sidebar.
      const skala = scope === "S"
        ? area.scale
        : scope === "P" ? area.width / petaTerakhir.petaG.width : 1;
      const lebarDasar = scope === "S" ? area.lebarAsli : petaTerakhir.petaG.width;
      const tinggiDasar = petaTerakhir.petaG.height;
      const lebarTampil = lebarDasar * skala - (scope === "S" ? (area.scrollbarWidth || 0) : 0);
      const tinggi = tinggiDasar * skala;
      [overlay, previewOverlay].forEach(node => {
        node.classList.remove("aktif");
        node.dataset.target = scope;
        node.style.left = `${area.left}px`;
        node.style.top = `${area.top}px`;
        node.style.width = `${lebarTampil}px`;
        node.style.height = `${tinggi}px`;
      });
      const kolomGrid = pickerPreviewAktif && targetOverlay === previewOverlay ? Number(previewOverlay.dataset.kolom || config.kolom) : config.kolom;
      const barisGrid = pickerPreviewAktif && targetOverlay === previewOverlay ? Number(previewOverlay.dataset.baris || config.baris) : config.baris;
      targetOverlay.style.setProperty("--grid-kolom", String(kolomGrid));
      targetOverlay.style.setProperty("--grid-baris", String(barisGrid));
      if (visible && area && area.width > 0 && area.height > 0) targetOverlay.classList.add("aktif");

      // Peta mengendalikan posisi menu: Home memakai PetaH, Bait memakai PetaB.
      // Menu kemudian mengendalikan posisi submenu melalui koordinat relatif menu.
      const tombolLama = halamanMenuAktif() === "bait" ? document.getElementById("tombolMenuUtama") : null;
      if (tombolLama) {
        const rect = tombolLama.getBoundingClientRect();
        posisiIkonMenuLama = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        tombolMenuLama = tombolLama;
        tombolLama.style.visibility = "hidden";
        tombolLama.style.pointerEvents = "none";
      }
      if (halamanMenuAktif() === "bait" && posisiIkonMenuLama) {
        ikonX.style.left = `${posisiIkonMenuLama.x}px`;
        ikonX.style.top = `${posisiIkonMenuLama.y}px`;
        ikonX.style.transform = "translate(-50%, -50%)";
        ikonX.style.display = "flex";
        ikonX.style.zIndex = "2147483647";
        menuGlobalBaru.style.display = "none";
        sesuaikanKontrasIkon(ikonX);
      } else {
        ikonX.style.display = "none";
      }

      // Ikon Sidebar statis di index.html; JS hanya menghubungkan aksinya.
      // Posisi ikon Grid dan Debug tetap mengikuti geometri A1 pada Peta S.
      if (petaTerakhir.petaS && window.A1Layout) {
        renderIkonDinamis(petaTerakhir);
        [ikonSidebarA1, ikonGridA1, ikonDebugA1].forEach(sesuaikanKontrasIkon);
      } else {
        // Posisi sementara sebelum geometri Peta S siap.
        Object.assign(ikonSidebarA1.style, {
          display:"flex", position:"fixed", top:"8px", right:"8px",
          left:"auto", bottom:"auto", transform:"none", zIndex:"2147483647"
        });
        ikonGridA1.style.display = "none";
        ikonDebugA1.style.display = "none";
      }
      Object.entries(targetButtons).forEach(([key,btn]) => {
        const active = key === scope;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      renderPicker();
    };
    const simpan = () => {
      config.kolom = Math.max(1, Math.min(64, Math.floor(Number(cols.input.value) || 1)));
      config.baris = Math.max(1, Math.min(64, Math.floor(Number(rows.input.value) || 1)));
      config.aktif = toggle.checked;
      config.tebalLuar = outerToggle.checked;
      localStorage.setItem("alfiyyah.grid.config", JSON.stringify(config));
      render();
    };
    toggle.addEventListener("change", simpan);
    outerToggle.addEventListener("change", simpan);
    window.addEventListener("resize", render, { passive:true });
    render();
    return { overlay, update: (height, viewportHeight, peta) => render(peta || window.alfiyyahPeta.baca()) };
  };
})();