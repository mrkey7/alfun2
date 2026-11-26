(async () => {
  "use strict";
  if (window.self !== window.top || document.getElementById("alfiyyahSidebar")) return;

  const loadScript = src => new Promise((resolve, reject) => {
    const node = document.createElement("script");
    node.src = src;
    node.onload = resolve;
    node.onerror = () => reject(new Error(`Gagal memuat: ${src}`));
    document.head.append(node);
  });
  await loadScript(APP.url("grid.a1").href);
  const a1Default = await APP.loadJSON("grid.a1Default");
  await loadScript(APP.url("sidebar.petakGlobal.js").href);

  const el = (tag, attrs = {}, text = "") => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text) node.textContent = text;
    return node;
  };
  const page = APP.page === "bait" ? "bait" : APP.page === "kuis" ? "kuis" : "sampul";
  const pageName = document.body.dataset.pageName || { sampul:"Home", bait:"Bait", kuis:"Kuis" }[page];

  const sidebar = el("aside", { id:"alfiyyahSidebar", "aria-label":"Pengaturan Alfiyyah" });
  const inner = el("div", { id:"alfiyyahSidebarInner" });
  const header = el("header", { class:"as-header" });
  const headerInfo = el("div", { class:"as-header-info" });
  headerInfo.append(el("h2", { class:"as-title" }, "ALFIYYAH"), el("p", { class:"as-subtitle" }, `Administrasi · ${pageName}`));
  header.append(headerInfo);
  const nav = el("nav", { class:"as-nav", "aria-label":"Daftar pengaturan" });
  const flyout = el("section", { id:"alfiyyahSidebarFlyout", "aria-live":"polite", hidden:"" });
  const flyoutTitle = el("h3", { class:"as-panel-title" });
  const flyoutContent = el("div", { class:"as-panel-content" });
  flyout.append(flyoutTitle, flyoutContent);
  sidebar.append(inner);
  const toolArea = el("section", { id:"alfiyyahSidebarToolArea", hidden:"" });
  const toolContent = el("div", { class:"as-panel-content" });
  toolArea.append(toolContent);
  inner.append(header, nav, toolArea);
  document.body.append(sidebar, flyout);
  sidebar.dataset.petaBlock = "Sidebar";
  let flyoutTimer = null;
  function tutupFlyout() { flyout.hidden = true; nav.querySelectorAll(".as-nav-item").forEach(node => node.classList.remove("is-selected")); }
  function jadwalkanTutup() { clearTimeout(flyoutTimer); flyoutTimer = setTimeout(tutupFlyout, 180); }
  flyout.addEventListener("pointerenter", () => clearTimeout(flyoutTimer));
  flyout.addEventListener("pointerleave", jadwalkanTutup);

  const generalContent = el("div");
  const sidebarContent = el("div");
  const gridContent = el("div");
  const kalibrasiContent = el("div", { id:"alfiyyahKalibrasiContent" });
  const toolPanels = new Map();
  let gridToolToggle = null;
  function aturTool(id, visible) {
    const panel = toolPanels.get(id);
    if (!panel) return;
    panel.hidden = !visible;
    toolArea.hidden = ![...toolPanels.values()].some(node => !node.hidden);
  }
  function buatPanelTool(id, label, content) {
    if (toolPanels.has(id)) return toolPanels.get(id);
    const panel = el("section", { class:"as-tool-panel", "data-tool-panel":id, hidden:"" });
    panel.append(el("h3", { class:"as-panel-title" }, label), content);
    toolContent.append(panel);
    toolPanels.set(id, panel);
    return panel;
  }
  function buatToggleTool(container, id, label, content) {
    const row = el("label", { class:"as-tool-toggle" });
    const check = el("input", { type:"checkbox", "data-tool":id });
    row.append(check, el("span", {}, label));
    buatPanelTool(id, label, content);
    check.addEventListener("change", () => aturTool(id, check.checked));
    container.append(row);
    return check;
  }
  const pageItems = page === "bait"
    ? [["menu","Menu"],["panel","Panel"],["bait","Bait"],["kalibrasi","Kalibrasi"]]
    : page === "sampul" ? [["sampul","Home"]] : [["kuis","Kuis"]];
  const items = [
    { id:"umum", label:"Umum", content:generalContent },
    { id:"sidebar", label:"Sidebar", content:sidebarContent },
    ...pageItems.map(([id,label]) => ({
      id,
      label,
      content: id === "kalibrasi" ? el("div", { id:"alfiyyahKalibrasiContent" }) : el("div")
    }))
  ];

  let menuModuleLoaded = false;
  let sampulModuleLoaded = false;
  function pilih(id, tampil = true) {
    const item = items.find(x => x.id === id);
    if (!item) return;
    nav.querySelectorAll(".as-nav-item").forEach(node => {
      const active = node.dataset.id === id;
      node.classList.toggle("is-selected", active);
      node.setAttribute("aria-current", active ? "true" : "false");
			const arrow = node.querySelector(".as-nav-arrow");
			if (arrow) arrow.textContent = active ? "⌄" : "›";
      //node.querySelector(".as-nav-arrow").textContent = active ? "⌄" : "›";
    });
    if (tampil) {
      clearTimeout(flyoutTimer);
      flyoutTitle.textContent = item.label;
      flyoutContent.replaceChildren(item.content);
      const trigger = tombolUmum;
      const rect = trigger.getBoundingClientRect();
      const batasPetaS = sidebar.getBoundingClientRect().right;
      flyout.style.left = `${batasPetaS}px`;
      flyout.style.top = `${Math.max(8, Math.min(rect.top, innerHeight - 220))}px`;
      flyout.hidden = false;
    }

    subnav.querySelectorAll(".as-subnav-item").forEach(node => {
      node.classList.toggle("is-selected", node.dataset.submenu === id);
      node.setAttribute("aria-current", node.dataset.submenu === id ? "true" : "false");
    });

    if (id === "umum" && !item.content.dataset.ready) {
      item.content.dataset.ready = "1";
      gridToolToggle = buatToggleTool(item.content, "grid", "Grid", gridContent);
    } else if (id === "sidebar" && !item.content.dataset.ready) {
      item.content.dataset.ready = "1";
      item.content.append(
        el("p", { class:"as-note" }, "Sidebar menggunakan lebar tetap 25% dari area layar.")
      );
    } else if (id === "sampul" && !item.content.dataset.ready) {
      item.content.dataset.ready = "1";
      const init = () => window.initSampulSidebar?.(item.content);
      if (sampulModuleLoaded) init();
      else {
        sampulModuleLoaded = true;
        loadScript(APP.url("sidebar.sampul").href).then(init).catch(error => item.content.append(el("p", { class:"as-note" }, error.message)));
      }
    } else if (id === "menu" && !item.content.dataset.ready) {
      item.content.dataset.ready = "1";
      const init = () => window.initMenuSidebar?.({ container:item.content, el });
      if (menuModuleLoaded) init();
      else {
        menuModuleLoaded = true;
        loadScript(APP.url("menu.sidebar").href).then(init).catch(error => item.content.append(el("p", { class:"as-note" }, error.message)));
      }
    } else if (id === "panel" && !item.content.dataset.ready) {
      item.content.dataset.ready = "1";
      const init = () => window.initPanelSidebar?.({ container:item.content, el });
      init();
    } else if (!item.content.dataset.ready && !["umum","sidebar","menu","panel","kalibrasi"].includes(id)) {
      item.content.dataset.ready = "1";
      const notes = {
        panel:"Pengaturan Panel belum dipindahkan ke administrasi sidebar. Kontrol yang ada pada halaman tetap digunakan.",
        bait:"Pengaturan Bait belum dipindahkan ke administrasi sidebar. Kontrol yang ada pada halaman tetap digunakan.",
        kuis:"Pengaturan Kuis belum tersedia."
      };
      item.content.append(el("p", { class:"as-note" }, notes[id] || `Pengaturan ${item.label} belum tersedia.`));
    }
  }

  const tombolUmum = el("button", { type:"button", class:"as-nav-item", "data-id":"umum" });
  tombolUmum.append(el("span", { class:"as-nav-label" }, "Umum"), el("span", { class:"as-nav-arrow", "aria-hidden":"true" }, "›"));
  tombolUmum.addEventListener("click", () => pilih("umum"));
  tombolUmum.addEventListener("pointerenter", () => pilih("umum"));
  tombolUmum.addEventListener("pointerleave", jadwalkanTutup);
  tombolUmum.addEventListener("focus", () => pilih("umum"));
  nav.append(tombolUmum);

  const subnav = el("div", { class:"as-general-subnav", "aria-label":"Pengaturan umum" });
  items.filter(item => item.id !== "umum").forEach(item => {
    if (item.id === "kalibrasi") {
      const label = el("label", { class:"as-subnav-check" });
      const check = el("input", { type:"checkbox", id:"alfiyyahKalibrasiToggle" });
      label.append(check, el("span", {}, item.label));
      check.addEventListener("change", () => {
        if (check.checked) {
          if (!kalibrasiContent.dataset.ready) {
            kalibrasiContent.dataset.ready = "1";
            kalibrasiContent.append(el("p", { class:"as-note" }, "Pengaturan kalibrasi akan ditampilkan di area ini."));
          }
          if (!toolPanels.has("kalibrasi")) buatPanelTool("kalibrasi", "Kalibrasi", kalibrasiContent);
        }
        aturTool("kalibrasi", check.checked);
      });
      subnav.append(label);
      return;
    }
    const b = el("button", { type:"button", class:"as-subnav-item", "data-submenu":item.id }, item.label);
    b.addEventListener("click", () => pilih(item.id));
    subnav.append(b);
  });
  generalContent.append(subnav);

  window.alfiyyahToggleGridTool = () => {
    if (!gridToolToggle) pilih("umum", false);
    if (!gridToolToggle) return;
    gridToolToggle.checked = !gridToolToggle.checked;
    gridToolToggle.dispatchEvent(new Event("change", { bubbles:true }));
    if (gridToolToggle.checked) setOpen(true);
  };

  const spacer = el("div", { id:"alfiyyahScaleSpacer", "aria-hidden":"true" });
  const stage = el("main", { id:"alfiyyahScaleStage" });
	const pageNodes = [...document.body.childNodes]
  .filter(node => node !== sidebar && node !== flyout);
 // const pageNodes = [...document.body.childNodes].filter(node => node !== sidebar && node !== flyout && node !== debug);
  document.body.append(spacer, stage);
  let petaBElement = null;
  if (page === "bait") {
    petaBElement = el("div", { id:"alfiyyahPetaB" });
    const menuBait = pageNodes.find(node => node.nodeType === 1 && node.matches(".menu-utama")) || null;
    const panelBait = pageNodes.find(node => node.nodeType === 1 && node.id === "panelKendali") || null;
    if (menuBait) pageNodes.splice(pageNodes.indexOf(menuBait), 1);
    if (panelBait) pageNodes.splice(pageNodes.indexOf(panelBait), 1);
    const panelArea = el("div", { id:"alfiyyahPanelArea", "data-peta-block":"Panel" });
    const menuBlock = el("div", { id:"alfiyyahMenuBlock", "data-peta-block":"Menu" });
    const isiBlock = el("div", { id:"alfiyyahIsiBlock", "data-peta-block":"Isi" });
    if (menuBait) menuBlock.append(menuBait);
    if (panelBait) panelArea.append(panelBait);
    else panelArea.hidden = true;
    isiBlock.append(...pageNodes);
    petaBElement.dataset.panelPresent = String(Boolean(panelBait));
    petaBElement.append(menuBlock, panelArea, isiBlock);
    stage.append(petaBElement);
  } else {
    const isiBlock = el("div", { id:"alfiyyahIsiBlock", "data-peta-block":pageName });
    isiBlock.append(...pageNodes);
    stage.append(isiBlock);
  }

  const petakGlobal = window.initPetakGlobal({ generalSection:gridContent, sidebar, el, a1Default });
  if (petakGlobal.overlay.parentNode !== document.body) document.body.append(petakGlobal.overlay);

  let contentHeight = window.alfiyyahPeta.ukuranInduk().height;
  function measureContent() {
    if (page === "sampul") return window.alfiyyahPeta.ukuranInduk().height;
    return Math.max(stage.scrollHeight, stage.offsetHeight, stage.getBoundingClientRect().height,
      stage.querySelector("#daftarBait")?.getBoundingClientRect().bottom || 0,
      window.alfiyyahPeta.ukuranInduk().height);
  }
  function updateScale() {
    const open = document.body.classList.contains("alfiyyah-sidebar-open");
    const scrollbarWidth = Math.max(0, inner.offsetWidth - inner.clientWidth);
    const peta = window.alfiyyahPeta.hitung({ sidebarOpen:open, sidebarScale:1, sidebarScrollbarWidth:scrollbarWidth, page });
    const { petaG,petaS,petaP } = peta;
    const scale = petaP.width / petaG.width;

    stage.style.width = `${petaG.width}px`;
    stage.style.height = `${Math.max(petaG.height,contentHeight)}px`;
    stage.style.transform = `translate3d(${petaP.left}px,0,0) scale(${scale})`;
    spacer.style.height = `${Math.max(petaG.height,contentHeight)*scale}px`;
    if (petaBElement) {
      petaBElement.style.width = `${petaG.width}px`;
      petaBElement.style.height = "auto";
      petaBElement.style.minHeight = "0";
      petaBElement.style.setProperty("--peta-p-grid-height", `${petaG.height}px`);
      petaBElement.style.setProperty("--peta-p-grid-width", `${petaG.width}px`);
      const gridRows = Number(getComputedStyle(document.documentElement).getPropertyValue("--panel-grid-rows")) || 16;
      const panelRows = Number(getComputedStyle(document.documentElement).getPropertyValue("--panel-area-rows")) || 1;
      petaBElement.style.setProperty("--panel-area-height", `${petaG.height * panelRows / gridRows}px`);
    }
    document.body.style.setProperty("--alfiyyah-sidebar-width", `${petaS.width}px`);
    document.body.style.setProperty("--alfiyyah-sidebar-button-edge", `${petaS.lebarAsli}px`);
    document.body.style.setProperty("--alfiyyah-sidebar-base-width", `${petaS.lebarAsli}px`);
    document.body.style.setProperty("--alfiyyah-sidebar-scale", String(petaS.scale));
    document.body.style.setProperty("--peta-s-width", `${petaS.width}px`);
    document.body.style.setProperty("--peta-p-left", `${petaP.left}px`);
    document.body.style.setProperty("--peta-p-width", `${petaP.width}px`);
    document.body.style.setProperty("--peta-p-grid-width", `${petaG.width}px`);
    document.body.style.setProperty("--peta-p-scale", String(scale));
    petakGlobal.update(Math.max(petaG.height,contentHeight)*scale,petaG.height*scale,peta);
  }
  function refresh() { contentHeight = measureContent(); updateScale(); }
  const sidebarOpenKey = "alfiyyah.sidebar.open";
  function setOpen(value) {
    const open = Boolean(value);
    try { localStorage.setItem(sidebarOpenKey, String(open)); } catch {}
    sidebar.classList.toggle("is-open",open);
    document.body.classList.toggle("alfiyyah-sidebar-open",open);
    updateScale();
  }
  window.alfiyyahToggleSidebarOpen = () => setOpen(!document.body.classList.contains("alfiyyah-sidebar-open"));

  // Mode Debug mengendalikan elemen peta yang sesungguhnya; panel debug
  // berada di luar PetaS/PetaP agar tetap dapat dipakai saat Sidebar disembunyikan.
  const debug = el("section", { id:"alfiyyahModeDebug", role:"dialog", "aria-modal":"true", "aria-label":"Mode Debug" });
  debug.hidden = true;
  const debugHeader = el("header", { class:"ad-header" });
  debugHeader.append(el("strong", {}, "Mode Debug"), el("span", {}, pageName));
  const debugClose = el("button", { type:"button", "aria-label":"Keluar Mode Debug" }, "×");
  debugHeader.append(debugClose);
  const debugTree = el("div", { class:"ad-tree" });
  debug.append(debugHeader, debugTree);
  document.body.append(debug);

  const blokPeta = [];
  if (page === "bait") {
    blokPeta.push(
      { id:"alfiyyahMenuBlock", label:"Menu" },
      { id:"alfiyyahPanelArea", label:"Panel" },
      { id:"alfiyyahIsiBlock", label:"Isi" }
    );
  } else blokPeta.push({ id:"alfiyyahIsiBlock", label:pageName });
  const semuaBlok = [{ id:"alfiyyahSidebar", label:"Sidebar" }, ...blokPeta];
  const buatCabang = (parent, item) => {
    const row = el("label", { class:"ad-item" });
    const check = el("input", { type:"checkbox", checked:"" });
    const caption = el("span", {}, item.label);
    check.addEventListener("change", () => {
      const node = document.getElementById(item.id);
      if (node) node.hidden = !check.checked;
      if (item.id === "alfiyyahSidebar") {
        sidebar.classList.toggle("is-open", check.checked && document.body.classList.contains("alfiyyah-sidebar-open"));
        if (!check.checked) tutupFlyout();
      }
    });
    row.append(check, caption);
    parent.append(row);
  };
  const rootBranch = el("div", { class:"ad-group" });
  rootBranch.append(el("div", { class:"ad-group-title" }, "PetaS"));
  buatCabang(rootBranch, semuaBlok[0]);
  const pageBranch = el("div", { class:"ad-group" });
  pageBranch.append(el("div", { class:"ad-group-title" }, "PetaP"));
  blokPeta.forEach(item => buatCabang(pageBranch, item));
  debugTree.append(rootBranch, pageBranch);
  document.body.append(debug);

  let modeDebug = false;
  function setModeDebug(aktif) {
    modeDebug = Boolean(aktif);
    debug.hidden = !modeDebug;
    document.body.classList.toggle("alfiyyah-mode-debug", modeDebug);
    document.getElementById("ikonDebugA1")?.setAttribute("aria-pressed", String(modeDebug));
  }
  const ikonDebug = document.getElementById("ikonDebugA1");
  ikonDebug?.addEventListener("click", () => setModeDebug(!modeDebug));
  debugClose.addEventListener("click", () => setModeDebug(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modeDebug) {
      event.preventDefault();
      event.stopPropagation();
      setModeDebug(false);
    }
  }, true);

  new ResizeObserver(refresh).observe(stage);
  const sidebarResizeObserver = new ResizeObserver(refresh);
  sidebarResizeObserver.observe(inner);
  new MutationObserver(refresh).observe(stage, { childList:true, subtree:true, attributes:true, characterData:true });
  window.addEventListener("resize",refresh,{passive:true});
  window.addEventListener("load",refresh,{once:true});
  if (document.fonts?.ready) document.fonts.ready.then(refresh);
  pilih("umum", false);
  let sidebarInitiallyOpen = false;
  try { sidebarInitiallyOpen = localStorage.getItem(sidebarOpenKey) === "true"; } catch {}
  setOpen(sidebarInitiallyOpen);
})();
