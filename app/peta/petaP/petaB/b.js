
(() => {
"use strict";
const $=id=>document.getElementById(id),wadah=$("daftarBait"),panel=$("panelKendali"),slider=$("ukuranFont"),out=$("nilaiFont"),pilihFont=$("pilihFont"),pilihTema=$("pilihTema"),batas=$("batasBait");
const key={font:"kalibrasi-font",tema:"kalibrasi-tema",harakat:"kalibrasi-harakat",variasi:"kalibrasi-variasi",tebal:"kalibrasi-tebal",batas:"kalibrasi-batas",hide:"kalibrasi-autohide",ukuran:"kalibrasi-ukuran",lebarPetak:"kalibrasi-lebar-petak"};

const daftarFont=["Amiri","Noto Naskh Arabic","Noto Sans Arabic","Traditional Arabic"];
let config={},sumber=[],view={tema:"klasik",harakat:true,variasi:false,tebal:false},hasilKalibrasi={};
let resetKalibrasi=()=>{};
let ukurLebarTeks;
let layoutBantuan=null;

const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
window.initKalibrasiMenu({$,el,menu:$("isiMenuUtama"),tombol:$("tombolMenuUtama"),menuUtama:$("menuUtama"),pilihFont,pilihTema,batas,slider,out,key,getConfig:()=>config});

window.initKalibrasiPanel({$,panel,menuUtama:$("menuUtama"),key});
const tanpaHarakat=s=>s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,"");
const teks=s=>view.harakat?s:tanpaHarakat(s);
const angkaArab=s=>s.replace(/[0-9]/g,n=>"٠١٢٣٤٥٦٧٨٩"[+n]);

async function pasangFont(){
  const folder=APP.url("aset.font");
  const daftar=[
    ["Amiri","Amiri-Regular.woff2","400"],["Amiri","Amiri-Bold.woff2","700"],
    ["Noto Naskh Arabic","NotoNaskhArabic-Regular.woff2","400"],["Noto Naskh Arabic","NotoNaskhArabic-Bold.woff2","700"],
    ["Noto Sans Arabic","NotoSansArabic-Regular.woff2","400"],["Noto Sans Arabic","NotoSansArabic-Bold.woff2","700"],
    ["Traditional Arabic","TraditionalArabic-Regular.woff2","400"],["Traditional Arabic","TraditionalArabic-Bold.woff2","700"]
  ];
  for(const [family,file,weight] of daftar){
    const face=new FontFace(family,`url("${new URL(file,folder).href}")`,{weight,style:"normal"});
    await face.load();document.fonts.add(face);
  }
}
async function muatHasilKalibrasi(){
  try{
    const data=await APP.loadJSON("data.kalibrasi",{cache:"no-cache"});
    hasilKalibrasi=data?.skala&&typeof data.skala==="object"?data.skala:{};
  }catch(e){hasilKalibrasi={};console.warn("Data kalibrasi belum tersedia.",e)}
}
function terapkan(){
  document.documentElement.dataset.tema=view.tema;
  document.body.classList.toggle("variasi-aktif",view.variasi);
  document.body.classList.toggle("teks-tebal",view.tebal);
  pilihTema.value=view.tema;
  $("tampilHarakat").checked=view.harakat;
  $("aktifVariasi").checked=view.variasi;
  $("teksTebal").checked=view.tebal;
}
function dataTerbatas(){
  const max=Math.max(0,Math.floor(+batas.value||0)),out=[];let count=0;
  for(const s of sumber){
    if(typeof s!=="string")continue;
    const bait=s.split("|").length===3;
    if(bait&&max&&count>=max)break;
    out.push(s);if(bait)count++;
  }
  return out;
}

// Lebar Peta dikembalikan ke koordinat lokal stage sebelum transformasi sidebar.
function lebarAcuanPeta(){
  const peta=window.alfiyyahPeta;
  if(peta?.hitung){
    const sidebarOpen=document.body.classList.contains("alfiyyah-sidebar-open");
    const {petaG,petaP,petaB}=peta.hitung({sidebarOpen,page:"bait"});
    if(petaG?.width>0&&petaP?.width>0&&petaB?.width>0){
      const skalaStage=petaP.width/petaG.width;
      return Math.max(1,petaB.width/skalaStage);
    }
    if(petaG?.width>0)return petaG.width;
  }
  return Math.max(1,wadah.clientWidth);
}
function aturLayoutBantuan(petak,wrap){
  layoutBantuan={petak,wrap};
  terapkanZoomBantuan();
}
function terapkanZoomBantuan(){
  const nilai=Math.max(0,Math.min(100,Number(slider.value)||0));
  out.value=out.textContent=`${nilai}%`;
  if(!layoutBantuan)return;
  const {petak,wrap}=layoutBantuan;
  if(!petak.isConnected)return;
  const lebar=Math.max(1,petak.offsetWidth);
  const tinggi=Math.max(1,petak.offsetHeight);
  const tersedia=lebarAcuanPeta();
  const skalaFit=tersedia/lebar;
  const skalaMin=skalaFit*0.1;
  const skala=skalaMin+(skalaFit-skalaMin)*nilai/100;
  petak.style.transform=`scale(${skala})`;
  wrap.style.width=`${lebar*skala}px`;
  wrap.style.height=`${tinggi*skala}px`;
}
async function simpanHasil(font,a,b,faktor){
  const response=await fetch(APP.api.saveKalibrasi,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({data:{font,autofit:a,target:b,faktor}})
  });
  const result=await response.json();
  if(!response.ok||!result.ok)throw Error(result.error||`HTTP ${response.status}`);
  hasilKalibrasi[font]={autofit:a,target:b,faktor};
}

function pasangKontrolKalibrasiSidebar(tombol,info,aksiPanel){
  const pasang=()=>{
    const content=$("alfiyyahKalibrasiContent");if(!content)return false;
    content.querySelector(".kalibrasi-sidebar-kontrol")?.remove();
    panel.querySelector("[data-kalibrasi-panel]")?.remove();
    const section=el("div","kalibrasi-sidebar-kontrol");
    section.append(el("div","kalibrasi-sidebar-judul","Kalibrasi"),tombol,info);
    const label=el("label","kalibrasi-pin-label"),pin=el("input","kalibrasi-pin");
    pin.type="checkbox";pin.checked=localStorage.getItem("kalibrasi-pin-panel")==="true";
    label.append(pin,el("span","","Tampilkan AUTOFIT di Panel"));section.append(label);
    content.querySelector(".as-note")?.remove();content.prepend(section);
    const panelButton=el("button","tombol-autofit-panel","AUTOFIT");
    panelButton.type="button";panelButton.dataset.kalibrasiPanel="";
    panelButton.addEventListener("click",aksiPanel);panel.append(panelButton);
    const apply=()=>{panelButton.hidden=!pin.checked;localStorage.setItem("kalibrasi-pin-panel",String(pin.checked));};
    pin.addEventListener("change",apply);apply();return true;
  };
  if(pasang())return;
  window.__kalibrasiSidebarObserver?.disconnect();
  window.__kalibrasiSidebarObserver=new MutationObserver(()=>{
    if(pasang()){window.__kalibrasiSidebarObserver.disconnect();window.__kalibrasiSidebarObserver=null;}
  });
  window.__kalibrasiSidebarObserver.observe(document.documentElement,{childList:true,subtree:true});
}
function pasangResize(petak,wrap){
  //const old=Number(localStorage.getItem(key.lebarPetak));
  //petak.style.width=`${Number.isFinite(old)&&old>0?old:Math.max(240,lebarAcuanPeta())}px`;
  let lebarAwal=Number(localStorage.getItem(key.lebarPetak));
	if(!Number.isFinite(lebarAwal)||lebarAwal<=0){
		lebarAwal=Math.max(240,lebarAcuanPeta());
		localStorage.setItem(key.lebarPetak,String(lebarAwal));
	}
	petak.style.width=`${lebarAwal}px`;
	
	aturLayoutBantuan(petak,wrap);
  const acuan=el("div","petak-acuan");acuan.setAttribute("aria-hidden","true");wrap.append(acuan);
  let tahap="autofit",A=null,B=null,font=pilihFont.value,locked=false,busy=false;
  const tombol=el("button","tombol-kalibrasi-tahap","AUTOFIT");tombol.type="button";tombol.id="tombolKalibrasi";
  const info=el("div","kalibrasi-info");
  const row=(name,value)=>{const r=el("div","kalibrasi-info-baris");r.append(el("span","kalibrasi-info-label",name),value);info.append(r);return value;};
  const f=row("Font",el("span","kalibrasi-info-value",font));
  const n=row("Jumlah bait",el("span","kalibrasi-info-value","—"));
  const a=row("A · Lebar awal",el("span","kalibrasi-info-value","—"));
  const b=row("B · Lebar target",el("span","kalibrasi-info-value","—"));
  const factor=row("F · Faktor",el("span","kalibrasi-info-value","—"));
  const status=row("Status",el("span","kalibrasi-info-value kalibrasi-status","Belum dilakukan pengukuran."));
  const show=()=>{f.textContent=font;n.textContent=n.dataset.count||"—";a.textContent=A===null?"—":`${A.toFixed(1)} px`;b.textContent=B===null?"—":`${B.toFixed(1)} px`;factor.textContent=A&&B?`${(B/A).toFixed(4)}×`:"—";};
  const msg=s=>status.textContent=s;
  const stage=s=>{tahap=s;tombol.textContent=s.toUpperCase();tombol.dataset.tahap=s;};
  const measure=async()=>{
    await document.fonts.ready;
    const h=ukurLebarTeks(petak);
    petak.style.width=`${h.lebar}px`;
    localStorage.setItem(key.lebarPetak,String(h.lebar));
    terapkanZoomBantuan();
    return h;
  };
  const reset=()=>{locked=false;A=B=null;font=pilihFont.value;n.dataset.count="";stage("autofit");petak.classList.remove("petak-terkunci");petak.style.removeProperty("--skala-konten");show();msg("Font berubah. Jalankan AUTOFIT kembali.");};
  resetKalibrasi=reset;
  const autofit=async(force=false)=>{if(busy||(!force&&locked))return;if(force){locked=false;petak.classList.remove("petak-terkunci");petak.style.removeProperty("--skala-konten");}busy=true;tombol.disabled=true;msg("Mengukur seluruh bait…");try{const h=await measure();A=h.lebar;B=null;font=pilihFont.value;n.dataset.count=String(h.jumlah);petak.style.removeProperty("--skala-konten");stage("lock");show();msg(`AUTOFIT selesai: ${h.jumlah} bait diukur.`);}catch(e){msg(`AUTOFIT gagal: ${e.message}`);console.error(e);}finally{busy=false;tombol.disabled=false;}};
  pasangKontrolKalibrasiSidebar(tombol,info,()=>autofit(true));
  const lock=()=>{if(!A){msg("Jalankan AUTOFIT sebelum LOCK.");return;}if(font!==pilihFont.value){reset();return;}locked=true;B=null;stage("simpan");petak.classList.add("petak-terkunci");petak.style.setProperty("--skala-konten","1");msg("Nilai A terkunci. Tekan SIMPAN untuk mencatat kalibrasi.");show();};
  const save=async()=>{if(!A||!locked){msg("Jalankan AUTOFIT lalu LOCK sebelum SIMPAN.");return;}B=1000;const factorValue=B/A;tombol.disabled=true;msg("Menyimpan hasil kalibrasi…");show();try{await simpanHasil(font,A,B,factorValue);msg(`Tersimpan untuk ${font}. A=${A.toFixed(1)} px, B=1000 px.`);locked=false;petak.classList.remove("petak-terkunci");stage("autofit");}catch(e){msg(`Gagal menyimpan: ${e.message}`);console.error(e);}finally{tombol.disabled=false;show();}};
  tombol.addEventListener("click",()=>{if(tahap==="autofit")autofit();else if(tahap==="lock")lock();else save();});
  for(const side of ["kiri","kanan"]){
    const grip=el("div",`pegangan-ukuran pegangan-${side}`);grip.setAttribute("role","separator");grip.setAttribute("aria-orientation","vertical");
    grip.setAttribute("aria-label",`Ubah lebar petak bantu dari sisi ${side}`);
    grip.addEventListener("pointerdown",e=>{if(localStorage.getItem("alfiyyah.pengaturan.umum.kunciPosisi")==="1")return;if(e.button!==0&&e.pointerType==="mouse")return;e.preventDefault();grip.setPointerCapture(e.pointerId);
      const x=e.clientX,w=petak.getBoundingClientRect().width,dir=side==="kanan"?1:-1;
      const move=ev=>{const v=Math.max(240,Math.round(w+dir*(ev.clientX-x)*2));petak.style.width=`${v}px`;localStorage.setItem(key.lebarPetak,String(v));};
      const done=()=>{grip.removeEventListener("pointermove",move);grip.removeEventListener("pointerup",done);grip.removeEventListener("pointercancel",done);};
      grip.addEventListener("pointermove",move);grip.addEventListener("pointerup",done);grip.addEventListener("pointercancel",done);
    });petak.append(grip);
  }
  show();const saved=hasilKalibrasi[pilihFont.value];if(saved?.faktor)msg(`Kalibrasi tersimpan: faktor ${Number(saved.faktor).toFixed(4)}×.`);
}

function render(){
  const frag=document.createDocumentFragment();let seq=0;
  for(const s of dataTerbatas()){
    const p=s.split("|");
    if(p.length===3){
      const row=el("div","baris bait");
      row.classList.add(seq++%2?"warna-isi-1":"warna-isi-2");
      row.append(el("div","kanan",teks(p[0].trim())),el("div","nomor",angkaArab(p[1].trim())),el("div","kiri",teks(p[2].trim())));
      frag.append(row);
    }else{
      const title=el("div","baris judul warna-judul-3");seq=0;
      if(config.ornamen===true){
        const svg='<svg viewBox="0 0 100 36" aria-hidden="true"><path d="M1 18H29 M29 18C40 18 39 5 51 5C62 5 63 13 54 18C63 23 62 31 51 31C39 31 40 18 29 18Z M49 18L54 13L59 18L54 23Z"/></svg>';
        const a=el("span","ornamen ornamen-kiri"),b=el("span","ornamen");a.innerHTML=svg;b.innerHTML=svg;
        title.append(a,el("span","teks-judul",teks(s.trim())),b);
      }else title.append(el("span","teks-judul",teks(s.trim())));
      frag.append(title);
    }
  }
  const petak=el("div","petak");petak.append(frag);
  const wrap=el("div","pembungkus-petak");wrap.append(petak);
  pasangResize(petak,wrap);wadah.replaceChildren(wrap);
  requestAnimationFrame(()=>terapkanZoomBantuan());
}
async function start(){
  try{
    await window.initPanelLayout?.({panel,menu: $("menuUtama")});
    const modulAutofit=await import(APP.url("autofit.js"));
    ukurLebarTeks=petak=>modulAutofit.ukurLebarTeks(petak,{el,dataTerbatas,teks,angkaArab});
    const [a,d]=await Promise.all([APP.loadJSON("rules.utama"),APP.loadJSON("data.bait")]);
    if(!Array.isArray(d))throw Error("Data Alfiyyah harus berupa array");
    config=a?.bait||{};sumber=d;
    await pasangFont();await muatHasilKalibrasi();
    const tema=localStorage.getItem(key.tema);
    view={tema:["klasik","terang","gelap"].includes(tema)?tema:"klasik",harakat:localStorage.getItem(key.harakat)!=="false",variasi:localStorage.getItem(key.variasi)==="true",tebal:localStorage.getItem(key.tebal)==="true"};
    document.documentElement.style.setProperty("--tambahan-font-judul",Math.max(0,+config["fontjudul+"]||0)/100);
    document.documentElement.style.setProperty("--pengurangan-font-nomor",Math.max(0,Math.min(100,+config["fontnomor-"]||0))/100);
    document.body.classList.toggle("garis-petak",config.garispetak===true);terapkan();
    const fonts=[...pilihFont.options].map(o=>o.value),saved=localStorage.getItem(key.font),font=fonts.includes(saved)?saved:(config.fontbawaan||"Traditional Arabic");
    pilihFont.value=fonts.includes(font)?font:"Traditional Arabic";
    document.documentElement.style.setProperty("--font-arab",`"${pilihFont.value}"`);
    document.documentElement.style.setProperty("--jarak-baris",+((config.jarakantarbaris||{})[pilihFont.value])||0);
    localStorage.setItem(key.font,pilihFont.value);
    batas.value=localStorage.getItem(key.batas)??(config.max>0?config.max:0);
    //const ukuranTersimpan=localStorage.getItem(key.ukuran),ukuranBawaan=Number(config.ukuran);
    //slider.value=ukuranTersimpan??(Number.isFinite(ukuranBawaan)?Math.max(0,Math.min(100,ukuranBawaan)):50);
    const ukuranTersimpan=localStorage.getItem(key.ukuran),
      ukuranBawaan=Number(config.ukuran);

		const ukuranDefault=Number.isFinite(ukuranBawaan)
			? Math.max(0,Math.min(100,ukuranBawaan))
			: 50;

		slider.dataset.defaultValue=String(ukuranDefault);
		slider.value=ukuranTersimpan??ukuranDefault;
				
		terapkanZoomBantuan();$("panelAutoHide").checked=localStorage.getItem(key.hide)==="1";window.syncPanelAlwaysOnTop?.();render();
  }catch(e){wadah.replaceChildren(el("div","error",`Gagal memuat Alfiyyah: ${e.message}`));console.error(e)}
}
pilihFont.addEventListener("change",()=>{
  localStorage.setItem(key.font,pilihFont.value);
  document.documentElement.style.setProperty("--font-arab",`"${pilihFont.value}"`);
  document.documentElement.style.setProperty("--jarak-baris",+((config.jarakantarbaris||{})[pilihFont.value])||0);
  render();
});
pilihTema.addEventListener("change",()=>{view.tema=pilihTema.value;localStorage.setItem(key.tema,view.tema);terapkan()});
$("tampilHarakat").addEventListener("change",e=>{view.harakat=e.target.checked;localStorage.setItem(key.harakat,view.harakat);render()});
$("aktifVariasi").addEventListener("change",e=>{view.variasi=e.target.checked;localStorage.setItem(key.variasi,view.variasi);terapkan()});
$("teksTebal").addEventListener("change",e=>{view.tebal=e.target.checked;localStorage.setItem(key.tebal,view.tebal);terapkan();render()});
batas.addEventListener("change",()=>{batas.value=Math.max(0,Math.floor(+batas.value||0));localStorage.setItem(key.batas,batas.value);render()});
slider.addEventListener("input",()=>{
  localStorage.setItem(key.ukuran,slider.value);
  terapkanZoomBantuan();
});
window.addEventListener("resize",()=>{if(layoutBantuan)terapkanZoomBantuan()});

const observer=new ResizeObserver(()=>requestAnimationFrame(terapkanZoomBantuan));
observer.observe(wadah);

// Sidebar mengubah geometri dan skala stage melalui class pada body.
const sidebarObserver=new MutationObserver(()=>{
  requestAnimationFrame(()=>requestAnimationFrame(terapkanZoomBantuan));
});
sidebarObserver.observe(document.body,{attributes:true,attributeFilter:["class"]});

start();
})();
