(() => {
  "use strict";

  if (window.self !== window.top) return;
  if (window.__alfiyyahSidebarLoading || document.getElementById("alfiyyahSidebar")) return;
  window.__alfiyyahSidebarLoading = true;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = APP.url("sidebar.css").href;
  document.head.append(css);
  APP.loadScript("sidebar.js").catch(error => {
    window.__alfiyyahSidebarLoading = false;
    console.error(error);
  });
})();
