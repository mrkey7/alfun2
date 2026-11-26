(() => {
  "use strict";

  const root = window.PATH_ROOT;
  const path = window.PATH;

  const url = key => {
    const value = key.split(".").reduce((obj, part) => obj?.[part], path);
    if (typeof value !== "string" || !value) {
      throw new Error(`Path tidak ditemukan: ${key}`);
    }
    return new URL(value, root);
  };

  const loadJSON = async (key, options = {}) => {
    const response = await fetch(url(key), options);
    if (!response.ok) throw new Error(`Gagal memuat ${key}: HTTP ${response.status}`);
    return response.json();
  };

  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src instanceof URL ? src.href : url(src).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Gagal memuat skrip: ${script.src}`));
    document.head.append(script);
  });

  window.APP = Object.freeze({
    root,
    path,
    page: window.APP_PAGE,
    url,
    loadJSON,
    loadScript,
    api: path.api
  });
})();
