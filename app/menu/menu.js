(() => {
  "use strict";
  if (window.alfiyyahMenu) return;

  const bacaJSON = async key => APP.loadJSON(key, { cache:"no-store" });
  const simpanLokal = "alfiyyah.menu.config";
  let pages = { halaman:[] };
  let config = { jump:{ aktif:true, label:"Jump", ikon:"arrow-left-right" }, preview:{ skala:100, blur:false } };
  let rootMenu, daftarMenu, jumpNode;

  const el = (tag, cls, text) => {
    const node=document.createElement(tag);
    if(cls) node.className=cls;
    if(text!==undefined) node.textContent=text;
    return node;
  };
  const halamanAktif = () => ({
    home:"petaH", sampul:"petaH", bait:"petaB", kuis:"petaK"
  }[APP.page] || APP.page);

  function buatWadah() {
    rootMenu=document.querySelector("#menuUtama");
    if(rootMenu) {
      daftarMenu=rootMenu.querySelector("#isiMenuUtama");
      if(!daftarMenu) {
        daftarMenu=el("nav","isi-menu-utama");
        daftarMenu.id="isiMenuUtama";
        rootMenu.append(daftarMenu);
      }
      return;
    }
    rootMenu=el("div","");
    rootMenu.id="alfiyyahMenuGlobal";
    const tombol=el("button","menu-global-pemicu","☰");
    tombol.type="button";
    tombol.setAttribute("aria-label","Menu");
    tombol.setAttribute("aria-expanded","false");
    daftarMenu=el("nav","menu-global-daftar");
    daftarMenu.hidden=true;
    tombol.addEventListener("click",()=>{
      daftarMenu.hidden=!daftarMenu.hidden;
      tombol.setAttribute("aria-expanded",String(!daftarMenu.hidden));
    });
    rootMenu.append(tombol,daftarMenu);
    document.body.append(rootMenu);
  }

  function renderJump() {
    if(!rootMenu || !daftarMenu) return;
    jumpNode?.remove();
    jumpNode=null;
    if(config.jump?.aktif===false) return;
    const tujuan=(pages.halaman||[]).filter(p=>p.aktif!==false && p.id!==halamanAktif() && p.url);
    if(!tujuan.length) return;

    jumpNode=el("div","menu-jump");
    const pemicu=el("button","menu-jump-pemicu",config.jump?.label||"Jump");
    pemicu.type="button";
    pemicu.setAttribute("aria-haspopup","true");
    pemicu.setAttribute("aria-expanded","false");
    pemicu.append(el("span","","›"));
    const sub=el("div","menu-jump-sub");
    sub.setAttribute("role","menu");
    const buka=()=>{jumpNode.classList.add("is-open");pemicu.setAttribute("aria-expanded","true");};
    const tutup=()=>{jumpNode.classList.remove("is-open");pemicu.setAttribute("aria-expanded","false");};
    jumpNode.addEventListener("mouseenter",buka);
    jumpNode.addEventListener("mouseleave",tutup);
    pemicu.addEventListener("click",e=>{
      e.stopPropagation();
      jumpNode.classList.contains("is-open")?tutup():buka();
    });
    tujuan.forEach(page=>{
      const item=el("button","menu-jump-tujuan",page.nama);
      item.type="button";
      item.setAttribute("role","menuitem");
      item.addEventListener("click",()=>{
        window.location.href=new URL(page.url,APP.root).href;
      });
      sub.append(item);
    });
    jumpNode.append(pemicu,sub);
    daftarMenu.append(jumpNode);
  }

  function terapkanPreview() {
    const scale=Math.max(50,Math.min(250,Number(config.preview?.skala)||100))/100;
    rootMenu?.style.setProperty("--menu-preview-scale",String(scale));
    rootMenu?.classList.toggle("menu-preview-scaled",scale!==1);
    document.body.classList.toggle("menu-preview-blur",Boolean(config.preview?.blur));
  }

  async function init() {
    const [pageConfig, menuConfig]=await Promise.all([
      bacaJSON("menu.pages"), bacaJSON("menu.config")
    ]);
    pages=pageConfig;
    config={...config,...menuConfig,
      jump:{...config.jump,...menuConfig.jump},
      preview:{...config.preview,...menuConfig.preview}};
    try {
      const local=JSON.parse(localStorage.getItem(simpanLokal)||"null");
      if(local) config={...config,...local,jump:{...config.jump,...local.jump},preview:{...config.preview,...local.preview}};
    } catch {}
    buatWadah();
    renderJump();
    terapkanPreview();
  }

  const ready=init().catch(error=>{
    console.error("Menu global gagal dimuat:",error);
    throw error;
  });
  window.alfiyyahMenu=Object.freeze({
    updateConfig(next) {
      config={...config,...next,
        jump:{...config.jump,...next.jump},
        preview:{...config.preview,...next.preview}};
      localStorage.setItem(simpanLokal,JSON.stringify(config));
      renderJump();
      terapkanPreview();
    },
    getConfig:()=>JSON.parse(JSON.stringify(config)),
    getPages:()=>pages.halaman.filter(p=>p.aktif!==false),
    ready
  });
})();