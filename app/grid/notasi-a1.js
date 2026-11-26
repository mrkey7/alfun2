(() => {
  "use strict";
  const DEFAULTS = Object.freeze({
    peta:"S", kolom:10, baris:20, target:"A1",
    konten:{jenis:"teks",nilai:""},
    ukuran:{kolom:1,baris:1,mode:"sel",lebar:28,tinggi:28},
    teks:{skala:0.8,horizontal:"tengah",vertikal:"tengah",bungkus:false,arah:"auto"},
    tampilan:{warna:null,latar:null,tebal:false,miring:false,padding:0}
  });

  const gabung = (dasar,tambahan) => {
    const hasil={...dasar,...(tambahan||{})};
    for(const key of Object.keys(dasar)){
      if(dasar[key] && typeof dasar[key]==="object" && !Array.isArray(dasar[key])){
        hasil[key]={...dasar[key],...(tambahan?.[key]||{})};
      }
    }
    return hasil;
  };

  function parse(nilai){
    const match=/^([A-Z]+)([1-9]\d*)$/i.exec(String(nilai||"").trim());
    if(!match) throw new Error("Notasi A1 tidak valid: "+nilai);
    let kolom=0;
    for(const huruf of match[1].toUpperCase()) kolom=kolom*26+huruf.charCodeAt(0)-64;
    return {kolom:kolom-1,baris:Number(match[2])-1};
  }

  function notasi(kolom,baris){
    if(!Number.isInteger(kolom)||kolom<0||!Number.isInteger(baris)||baris<0) throw new Error("Indeks kolom/baris tidak valid.");
    let n=kolom+1,huruf="";
    while(n>0){const sisa=(n-1)%26;huruf=String.fromCharCode(65+sisa)+huruf;n=Math.floor((n-1)/26);}
    return huruf+(baris+1);
  }

  function geometri(config,dataPeta){
    const nama=config.peta||"S";
    const area=dataPeta && dataPeta["peta"+nama];
    if(!area) throw new Error("Area peta tidak ditemukan: "+nama);
    // Peta turunan mewarisi skala dari PetaP; tidak menghitung skala sendiri.
    const skala=Number(area.scale??(nama==="S"?1:NaN));
    const lebar=nama==="S"
      ? Number(area.lebarAsli??area.width) - Number(area.scrollbarWidth||0)/skala
      : Number(dataPeta.petaG.width);
    const tinggi=Number(dataPeta.petaG.height);
    if(!(lebar>0)||!(tinggi>0)||!(skala>0)) throw new Error("Geometri peta "+nama+" belum siap.");
    return {area,skala,lebarSel:lebar/config.kolom,tinggiSel:tinggi/config.baris};
  }

  function posisi(parameter,dataPeta){
    const config=gabung(DEFAULTS,parameter);
    config.ukuran=gabung(DEFAULTS.ukuran,parameter?.ukuran);
    config.teks=gabung(DEFAULTS.teks,parameter?.teks);
    config.tampilan=gabung(DEFAULTS.tampilan,parameter?.tampilan);
    config.konten=gabung(DEFAULTS.konten,parameter?.konten);
    config.kolom=Number(config.kolom);config.baris=Number(config.baris);
    if(!Number.isInteger(config.kolom)||config.kolom<1||!Number.isInteger(config.baris)||config.baris<1) throw new Error("Jumlah kolom dan baris harus bilangan bulat positif.");
    const awal=parse(config.target);
    const rentangKolom=Math.max(1,Number(config.ukuran.kolom)||1);
    const rentangBaris=Math.max(1,Number(config.ukuran.baris)||1);
    if(awal.kolom+rentangKolom>config.kolom||awal.baris+rentangBaris>config.baris) throw new Error("Target "+config.target+" melewati batas grid "+config.kolom+" × "+config.baris+".");
    const geo=geometri(config,dataPeta);
    const x=geo.area.left+awal.kolom*geo.lebarSel*geo.skala;
    const y=geo.area.top+awal.baris*geo.tinggiSel*geo.skala;
    const lebarSel=rentangKolom*geo.lebarSel*geo.skala;
    const tinggiSel=rentangBaris*geo.tinggiSel*geo.skala;
    const tetap=config.ukuran.mode==="tetap";
    return {...config,sel:awal,
      left:tetap?x+lebarSel/2:x,top:tetap?y+tinggiSel/2:y,
      width:tetap?Number(config.ukuran.lebar||28)*geo.skala:lebarSel,
      height:tetap?Number(config.ukuran.tinggi||28)*geo.skala:tinggiSel,
      cellWidth:geo.lebarSel*geo.skala,cellHeight:geo.tinggiSel*geo.skala,
      scale:geo.skala,centered:tetap};
  }

  function sequence(parameter,dataPeta){
    const config=gabung(DEFAULTS,parameter);
    const mulai=parse(config.mulai||config.target||"A1");
    const daftar=Array.isArray(config.konten?.nilai)?config.konten.nilai:(Array.isArray(config.items)?config.items:[]);
    const jumlah=Math.max(0,Math.floor(Number(config.jumlah??daftar.length)));
    const langkah=Math.max(1,Math.floor(Number(config.langkah)||1));
    const arah=config.arah||"bawah";
    if(!["bawah","kanan"].includes(arah)) throw new Error("Arah sequence tidak dikenal: "+arah);
    return Array.from({length:jumlah},(_,i)=>{
      const item=daftar[i];
      const khusus=item&&typeof item==="object"&&!Array.isArray(item)?item:{};
      const nilai=typeof item==="string"?item:khusus.nilai;
      const cfg=gabung(config,khusus);
      cfg.target=notasi(mulai.kolom+(arah==="kanan"?i*langkah:0),mulai.baris+(arah==="bawah"?i*langkah:0));
      cfg.konten=gabung(config.konten||DEFAULTS.konten,khusus.konten||{});
      if(nilai!==undefined) cfg.konten.nilai=nilai;
      return posisi(cfg,dataPeta);
    });
  }

  function terapkan(element,layout){
    if(!element) throw new Error("Elemen target tidak ditemukan.");
    Object.assign(element.style,{
      position:"fixed",left:layout.left+"px",top:layout.top+"px",
      width:layout.width+"px",height:layout.height+"px",
      transform:layout.centered?"translate(-50%, -50%)":"none",display:"flex",
      alignItems:({atas:"flex-start",tengah:"center",bawah:"flex-end"})[layout.teks.vertikal]||"center",
      justifyContent:({kiri:"flex-start",tengah:"center",kanan:"flex-end"})[layout.teks.horizontal]||"center",
      textAlign:layout.teks.horizontal||"center",direction:layout.teks.arah||"auto",
      whiteSpace:layout.teks.bungkus?"normal":"nowrap",
      fontSize:(layout.cellWidth*Number(layout.teks.skala||0.8))+"px",
      color:layout.tampilan.warna||"",background:layout.tampilan.latar||"transparent",
      fontWeight:layout.tampilan.tebal?"bold":"normal",fontStyle:layout.tampilan.miring?"italic":"normal",
      padding:(Number(layout.tampilan.padding)||0)+"px",boxSizing:"border-box"
    });
    if(["teks","ikon"].includes(layout.konten?.jenis)&&layout.konten.nilai!==undefined&&layout.konten.nilai!=="") element.textContent=String(layout.konten.nilai);
    return element;
  }
  window.A1Layout=Object.freeze({defaults:DEFAULTS,parse,notasi,posisi,sequence,terapkan});
})();