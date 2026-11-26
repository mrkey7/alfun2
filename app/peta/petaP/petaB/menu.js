(() => {
"use strict";
window.initKalibrasiMenu = ({ $, el, menu, tombol, menuUtama, pilihFont, pilihTema, batas, slider, out, key, getConfig }) => {
  const config = new Proxy({}, { get: (_, nama) => getConfig()?.[nama] });
function buatMenuPilihan(select,nama){
  const label=select.closest("label");
  if(!label||label.dataset.menuSiap)return;
  label.dataset.menuSiap="1";
  const pembungkus=el("div","menu-kontrol");
  const pemicu=el("button","menu-kontrol-tombol",nama);
  pemicu.type="button";
  pemicu.setAttribute("aria-haspopup","true");
  pemicu.setAttribute("aria-expanded","false");
  const submenu=el("div","submenu-kontrol");
  submenu.setAttribute("role","menu");
  const sinkronkanPilihan=()=>{
    [...submenu.children].forEach((item,index)=>{
      item.setAttribute("aria-selected",String(select.options[index]?.value===select.value));
    });
  };
  const tutup=()=>{pembungkus.classList.remove("is-open");pemicu.setAttribute("aria-expanded","false")};
  const buka=()=>{
    sinkronkanPilihan();
    pembungkus.classList.add("is-open");
    pemicu.setAttribute("aria-expanded","true");
  };
  [...select.options].forEach((option,index)=>{
    const item=el("button","",option.textContent);
    item.type="button";
    item.setAttribute("role","menuitemradio");
    item.setAttribute("aria-selected",String(option.value===select.value));
    item.addEventListener("click",()=>{
      select.value=option.value;
      select.dispatchEvent(new Event("change",{bubbles:true}));
      sinkronkanPilihan();
      tutup();
    });
    submenu.append(item);
  });
  select.addEventListener("change",sinkronkanPilihan);
  sinkronkanPilihan();
  pemicu.addEventListener("click",e=>{
    e.stopPropagation();
    pembungkus.classList.contains("is-open")?tutup():buka();
  });
  pembungkus.addEventListener("mouseenter",buka);
  pembungkus.addEventListener("mouseleave",tutup);
  pembungkus.addEventListener("keydown",e=>{
    if(e.key==="Escape"){tutup();pemicu.focus()}
  });
  label.replaceChildren(pembungkus);
  pembungkus.append(pemicu,submenu,select);
  document.addEventListener("click",e=>{if(!pembungkus.contains(e.target))tutup()});
}
buatMenuPilihan(pilihFont,"Font");
buatMenuPilihan(pilihTema,"Tema");
/* PAKET 6A – MENU DUPLIKASI DIPULIHKAN
   Menu utama tetap berisi duplikasi semua kontrol.
   Checkbox pada Panel hanya mengatur visibilitas kontrol di Panel asal. */
function buatDuplikatKontrolMenu(){
  if(!menu || menu.querySelector(".menu-panel-duplikat"))return;
  const bagian=el("div","menu-panel-duplikat");

  function buatFlyout(nama){
    const wrap=el("div","menu-flyout");
    const pemicu=el("button","menu-flyout-pemicu",nama);
    pemicu.type="button";
    pemicu.setAttribute("aria-haspopup","true");
    pemicu.setAttribute("aria-expanded","false");
    const sub=el("div","menu-flyout-sub");
    const buka=()=>{wrap.classList.add("is-open");pemicu.setAttribute("aria-expanded","true")};
    const tutup=()=>{wrap.classList.remove("is-open");pemicu.setAttribute("aria-expanded","false")};
    wrap.addEventListener("mouseenter",buka);
    wrap.addEventListener("mouseleave",tutup);
    pemicu.addEventListener("click",e=>{
      e.stopPropagation();
      wrap.classList.contains("is-open")?tutup():buka();
    });
    wrap.append(pemicu,sub);
    bagian.append(wrap);
    return {wrap,pemicu,sub};
  }

  function buatFlyoutPilihan(nama,asal){
    const fly=buatFlyout(nama);
    const sinkronkanPilihan=()=>{
      [...fly.sub.children].forEach((item,index)=>{
        item.setAttribute("aria-selected",String(asal.options[index]?.value===asal.value));
      });
    };
    fly.wrap.addEventListener("mouseenter",sinkronkanPilihan);
    fly.pemicu.addEventListener("click",sinkronkanPilihan);
    [...asal.options].forEach((o,i)=>{
      const item=el("button","menu-flyout-opsi",o.textContent);
      item.type="button";
      item.setAttribute("aria-selected",String(o.value===asal.value));
      item.addEventListener("click",e=>{
        e.stopPropagation();
        asal.value=o.value;
        asal.dispatchEvent(new Event("change",{bubbles:true}));
        sinkronkanPilihan();
        fly.wrap.classList.remove("is-open");
        fly.pemicu.setAttribute("aria-expanded","false");
      });
      fly.sub.append(item);
    });
    asal.addEventListener("change",sinkronkanPilihan);
    sinkronkanPilihan();
  }

  function duplikasi(nama,asal,jenis="checkbox"){
    if(!asal)return;
    const row=el("div","menu-panel-baris");
    const teksLabel=el(asal===batas?"button":"span",asal===batas?"menu-panel-label menu-panel-reset-teks":"menu-panel-label",nama);
    if(asal===batas)teksLabel.type="button";
    row.append(teksLabel);
    const salinan=asal.cloneNode(false);
    salinan.removeAttribute("id");
    salinan.className="menu-panel-input";
    if(jenis==="number"){
      salinan.value=asal.value;
      salinan.addEventListener("change",()=>{
        asal.value=salinan.value;
        asal.dispatchEvent(new Event("change",{bubbles:true}));
      });
      asal.addEventListener("change",()=>{salinan.value=asal.value});
      if(asal===batas){
        teksLabel.title="Klik untuk mengembalikan Batas Bait ke default";
        const resetBatas=()=>{
          const nilaiDefault=Number(config.max)>0?Math.floor(Number(config.max)):0;
          asal.value=String(nilaiDefault);
          asal.dispatchEvent(new Event("change",{bubbles:true}));
        };
        teksLabel.addEventListener("click",e=>{
          e.preventDefault();
          e.stopPropagation();
          resetBatas();
        });
        teksLabel.addEventListener("keydown",e=>{
          if(e.key==="Enter"||e.key===" "){
            e.preventDefault();
            e.stopPropagation();
            resetBatas();
          }
        });
      }
    }else{
      salinan.checked=asal.checked;
      salinan.addEventListener("change",()=>{
        asal.checked=salinan.checked;
        asal.dispatchEvent(new Event("change",{bubbles:true}));
      });
      asal.addEventListener("change",()=>{salinan.checked=asal.checked});
    }
    row.append(salinan);
    bagian.append(row);
  }

  /* Panel: satu checkbox utama pada pemicu, submenu khusus pin/unpin. */
  const panelFlyout=buatFlyout("Panel"); 
  const panelAsal=$("panelAutoHide");
  if(panelAsal){
    panelFlyout.pemicu.textContent="";
    const label=el("span","menu-panel-label","Panel");
    const cb=panelAsal.cloneNode(false);
    cb.removeAttribute("id");
    cb.className="menu-panel-input menu-panel-pin";
    cb.checked=panelAsal.checked;
    cb.addEventListener("click",e=>e.stopPropagation());
    cb.addEventListener("change",e=>{
      e.stopPropagation();
      panelAsal.checked=cb.checked;
      panelAsal.dispatchEvent(new Event("change",{bubbles:true}));
    });
    panelAsal.addEventListener("change",()=>{cb.checked=panelAsal.checked});
    panelFlyout.pemicu.append(label,cb);
  }

  const daftar=[
    ["Font","font",pilihFont],
    ["Tema","tema",pilihTema],
    ["Harakat","harakat",$("tampilHarakat")],
    ["Variasi","variasi",$("aktifVariasi")],
    ["Tebal","tebal",$("teksTebal")],
    ["Batas Bait","batas",batas],
    ["Ukuran Font","ukuran",slider]
  ];

  /* Checkbox submenu hanya menyembunyikan/menampilkan kontrol Panel asal. */
  for(const [nama,id,asal] of daftar){
    if(!asal)continue;
    const row=el("label","menu-panel-baris menu-panel-pilihan");
    const cb=el("input","menu-panel-input");
    cb.type="checkbox";
    cb.checked=localStorage.getItem("kalibrasi-panel-"+id)!=="false";
    const target=asal.closest("label")||asal.parentElement;
    const terapkan=()=>{if(target)target.hidden=!cb.checked};
    cb.addEventListener("change",()=>{
      localStorage.setItem("kalibrasi-panel-"+id,String(cb.checked));
      terapkan();
    });
    terapkan();
    row.append(el("span","menu-panel-label",nama),cb);
    panelFlyout.sub.append(row);
  }

  /* Duplikasi kontrol tetap berada di menu utama, bukan dipindah ke submenu Panel. */
  buatFlyoutPilihan("Font",pilihFont);
  buatFlyoutPilihan("Tema",pilihTema);
  duplikasi("Harakat",$("tampilHarakat"));
  duplikasi("Variasi",$("aktifVariasi"));
  duplikasi("Tebal",$("teksTebal"));
  duplikasi("Batas Bait",batas,"number");

	const rowUkuran=el("div","menu-panel-ukuran");

	const barisJudul=el("div","menu-panel-ukuran-judul");
	const teksUkuran=el("span","menu-panel-label","Ukuran Font");

	const nilai=el("button","menu-panel-nilai menu-panel-reset-teks",out.value||`${slider.value}%`);
	nilai.type="button";
	nilai.title="Klik untuk mengembalikan Ukuran Font ke default";

	const resetUkuran=()=>{
		const nilaiDefault=Number(config.ukuran);
		slider.value=String(Number.isFinite(nilaiDefault)?Math.max(0,Math.min(100,nilaiDefault)):50);
		localStorage.removeItem(key.ukuran);
		slider.dispatchEvent(new Event("input",{bubbles:true}));
	};

	nilai.addEventListener("click",resetUkuran);
	barisJudul.append(teksUkuran,nilai);

	const barisSlider=el("div","menu-panel-slider-row");

	const range=slider.cloneNode(false);
	range.removeAttribute("id");
	range.className="menu-panel-input";
	range.value=slider.value;

	const tombolKiri=el("button","menu-panel-panah","<");
	const tombolKanan=el("button","menu-panel-panah",">");

	tombolKiri.type=tombolKanan.type="button";
	tombolKiri.title="Kurangi ukuran font";
	tombolKanan.title="Tambah ukuran font";
	tombolKiri.setAttribute("aria-label","Kurangi ukuran font");
	tombolKanan.setAttribute("aria-label","Tambah ukuran font");

	range.addEventListener("input",()=>{
		slider.value=range.value;
		slider.dispatchEvent(new Event("input",{bubbles:true}));
	});

	slider.addEventListener("input",()=>{
		range.value=slider.value;
		nilai.textContent=out.value||`${slider.value}%`;
	});

	const geserUkuran=arah=>{
		const min=Number(range.min)||0;
		const max=Number(range.max)||100;
		const step=Number(range.step)||1;
		range.value=String(Math.max(min,Math.min(max,Number(range.value)+arah*step)));
		range.dispatchEvent(new Event("input",{bubbles:true}));
	};

	tombolKiri.addEventListener("click",()=>geserUkuran(-1));
	tombolKanan.addEventListener("click",()=>geserUkuran(1));

	barisSlider.append(tombolKiri,range,tombolKanan);
	rowUkuran.append(barisJudul,barisSlider);
	bagian.append(rowUkuran);

  menu.append(bagian);
  const reset=$("resetPengaturan");
  if(reset){
    reset.textContent="reset";
    reset.classList.add("menu-reset-ringkas");
    menu.append(reset);
  }
}
buatDuplikatKontrolMenu();


  function closeMenu(){menu.hidden=true;tombol.setAttribute("aria-expanded","false")}
  tombol.addEventListener("click",()=>{menu.hidden=!menu.hidden;tombol.setAttribute("aria-expanded",String(!menu.hidden))});
  /* Paket 40/41: menu utama membuka submenu saat disorot, seperti menu Font dan Tema. */
  menuUtama.addEventListener("mouseenter",()=>{menu.hidden=false;tombol.setAttribute("aria-expanded","true")});
  menuUtama.addEventListener("mouseleave",closeMenu);
  document.addEventListener("click",e=>{if(!menuUtama.contains(e.target))closeMenu()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu()});
  $("resetPengaturan").addEventListener("click",()=>{
    closeMenu();
    if(confirm("Kembalikan pengaturan tampilan ke nilai bawaan?")){
      Object.values(key)
				.filter(k=>k!==key.lebarPetak)
				.forEach(k=>localStorage.removeItem(k));
      location.reload();
    }
  });
};
})();
