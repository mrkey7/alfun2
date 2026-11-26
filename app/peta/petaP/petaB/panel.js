(() => {
"use strict";
window.initKalibrasiPanel = ({ $, panel, menuUtama, key }) => {
  let lastY=scrollY;
  /* Pertahankan input lama untuk sinkronisasi kontrol Menu, tetapi sembunyikan baris visualnya. */
  const input=$("panelAutoHide");
  const elemenPin=[];
  let observerArea=null, resizeArea=null;
  function pindahkanKeBody(id,kelas){
    const node=document.getElementById(id);
    if(!node)return;
    let data=elemenPin.find(x=>x.node===node);
    if(!data){
      data={node,parent:node.parentElement,placeholder:document.createElement("div")};
      data.placeholder.className="panel-always-on-top-placeholder";
      data.placeholder.style.height=`${node.offsetHeight}px`;
      data.parent.insertBefore(data.placeholder,node);
      elemenPin.push(data);
      if(node.id==="alfiyyahPanelArea"&&resizeArea)resizeArea.disconnect();
      if(node.id==="alfiyyahPanelArea"){
        resizeArea=new ResizeObserver(()=>{if(data.placeholder.isConnected)data.placeholder.style.height=`${node.offsetHeight}px`});
        resizeArea.observe(node);
      }
    }
    if(node.parentElement!==document.body)document.body.append(node);
    node.classList.add(kelas);
  }
  function kembalikanDariBody(){
    for(const data of [...elemenPin].reverse()){
      data.node.classList.remove("panel-always-on-top","menu-always-on-top");
      if(data.placeholder.isConnected)data.placeholder.replaceWith(data.node);
    }
    elemenPin.length=0;
    if(resizeArea){resizeArea.disconnect();resizeArea=null}
  }
  function sinkronkanAlwaysOnTop(){
    if(!input)return;
    if(input.checked){
      pindahkanKeBody("alfiyyahPanelArea","panel-always-on-top");
      pindahkanKeBody("alfiyyahMenuBlock","menu-always-on-top");
    }else if(elemenPin.length)kembalikanDariBody();
  }
  if(input){
    input.checked=localStorage.getItem(key.hide)==="1";
    input.addEventListener("change",sinkronkanAlwaysOnTop);
    observerArea=new MutationObserver(sinkronkanAlwaysOnTop);
    observerArea.observe(document.body,{childList:true,subtree:true});
    sinkronkanAlwaysOnTop();
  }
  if(input){
    const baris=input.closest(".opsi-panel") || input.closest("label") || input.parentElement;
    if(baris){baris.hidden=true;baris.setAttribute("aria-hidden","true")}
  }
  /* Kontrol ukuran font: < slider > persentase. */
  const slider=$("ukuranFont"),out=$("nilaiFont");
  if(slider&&out){
    const label=slider.closest("label");
    const wrap=document.createElement("div");
    wrap.className="panel-ukuran-kontrol";

    const kiri=document.createElement("button");
    const kanan=document.createElement("button");
    kiri.type=kanan.type="button";
    kiri.className=kanan.className="panel-ukuran-panah";
    kiri.textContent="<";
    kanan.textContent=">";
    kiri.setAttribute("aria-label","Kurangi ukuran font");
    kanan.setAttribute("aria-label","Tambah ukuran font");

    const ubah=arah=>{
      const min=Number(slider.min)||0;
      const max=Number(slider.max)||100;
      const step=Number(slider.step)||1;
      slider.value=String(Math.max(min,Math.min(max,Number(slider.value)+arah*step)));
      slider.dispatchEvent(new Event("input",{bubbles:true}));
    };
    kiri.addEventListener("click",()=>ubah(-1));
    kanan.addEventListener("click",()=>ubah(1));

    const reset=()=>{
      slider.value=slider.dataset.defaultValue||"50";
      localStorage.removeItem(key.ukuran);
      slider.dispatchEvent(new Event("input",{bubbles:true}));
    };
    out.classList.add("panel-ukuran-nilai");
    out.setAttribute("role","button");
    out.tabIndex=0;
    out.title="Klik untuk mengembalikan ukuran bawaan";
    out.addEventListener("click",reset);
    out.addEventListener("keydown",e=>{
      if(e.key==="Enter"||e.key===" "){e.preventDefault();reset()}
    });

    wrap.append(kiri,slider,kanan,out);
    label.replaceChildren(wrap);
    label.classList.add("opsi-ukuran");
  }
  /* Sinkronisasi kontrol saat Bait dipratinjau di Admin. */
  window.setAdminPreviewScroll=(parentScroll,direction,scale)=>{
    const offset=Math.max(0,Number(parentScroll)||0)/Math.max(.01,Number(scale)||1);
    menuUtama.style.setProperty("--admin-preview-offset",`${offset}px`);
    panel.style.setProperty("--admin-preview-offset",`${offset}px`);
    if(input.checked){
      panel.classList.remove("panel-tersembunyi");
    }else if(parentScroll<12||direction< -3){
      panel.classList.remove("panel-tersembunyi");
    }else if(direction>3&&parentScroll>60){
      panel.classList.add("panel-tersembunyi");
    }
  };
  input.addEventListener("change",e=>{
    localStorage.setItem(key.hide,e.target.checked?"1":"0");
    if(e.target.checked)panel.classList.remove("panel-tersembunyi");
  });
  window.addEventListener("scroll",()=>{
    if(window.__alfiyyahSidebarChanging){lastY=scrollY;return}
    if(input.checked)return;
    const y=scrollY,d=y-lastY;
    if(y<12||d< -3)panel.classList.remove("panel-tersembunyi");
    else if(d>3&&y>60)panel.classList.add("panel-tersembunyi");
    lastY=y;
  },{passive:true});
};
})();
