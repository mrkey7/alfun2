(() => {
  "use strict";
  const script = document.currentScript;
  const appURL = new URL("./", script.src);
  const rootURL = new URL("../", appURL);
  const page = script.dataset.page || "home";

  const loadScript = src => new Promise((resolve, reject) => {
    const node = document.createElement("script");
    node.src = new URL(src, rootURL).href;
    node.onload = resolve;
    node.onerror = () => reject(new Error(`Gagal memuat skrip: ${src}`));
    document.head.append(node);
  });
  const loadCSS = src => {
    const node = document.createElement("link");
    node.rel = "stylesheet";
    node.href = new URL(src, rootURL).href;
    document.head.append(node);
  };

  fetch(new URL("path.json", appURL), { cache: "no-store" })
    .then(r => {
      if (!r.ok) throw new Error(`Gagal membaca path.json: HTTP ${r.status}`);
      return r.json();
    })
    .then(async path => {
      window.PATH = path;
      window.PATH_ROOT = rootURL.href;
      window.APP_PAGE = page;
      await loadScript(path.bootstrap.global);
      await loadScript(path.bootstrap.peta);
      const APP = window.APP;

      if (page === "home") {
        loadCSS(path.halaman.home.css);
        loadCSS(path.menu.css);
        await loadScript(path.halaman.home.js);
        await loadScript(path.menu.js);
        await loadScript(path.sidebar.global);
      } else if (page === "bait") {
        for (const css of path.halaman.bait.css) loadCSS(css);
        loadCSS(path.menu.css);
        for (const js of path.halaman.bait.js) await loadScript(js);
      } else if (page === "blank") {
        loadCSS(path.sidebar.css);
        await loadScript(path.sidebar.js);
      } else {
        throw new Error(`Halaman tidak dikenal: ${page}`);
      }
    })
    .catch(error => {
      console.error("Inisialisasi aplikasi gagal:", error);
      const target = document.querySelector("main") || document.body;
      const message = document.createElement("div");
      message.className = "error";
      message.textContent = `Gagal memuat aplikasi: ${error.message}`;
      target.append(message);
    });
})();