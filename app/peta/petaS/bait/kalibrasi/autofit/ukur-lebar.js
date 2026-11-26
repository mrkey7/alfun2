// Inti pengukuran AUTOFIT. Algoritma asli dipertahankan.
export function ukurLebarTeks(petak,{el,dataTerbatas,teks,angkaArab}){
  const contoh=petak.querySelector(".bait"),contohNomor=petak.querySelector(".nomor");
  if(!contoh)throw Error("Tidak ditemukan contoh bait untuk pengukuran.");
  const gaya=getComputedStyle(contoh),gayaNomor=contohNomor?getComputedStyle(contohNomor):gaya;
  const ukur=el("span","", "");
  Object.assign(ukur.style,{
    position:"absolute",visibility:"hidden",left:"-100000px",top:"0",
    display:"inline-block",width:"max-content",maxWidth:"none",
    whiteSpace:"pre",direction:"rtl",font:gaya.font,
    fontFamily:gaya.fontFamily,fontSize:gaya.fontSize,fontWeight:gaya.fontWeight,
    letterSpacing:gaya.letterSpacing,fontKerning:gaya.fontKerning,
    fontFeatureSettings:gaya.fontFeatureSettings
  });
  document.body.append(ukur);
  const baca=(teks,fontStyle)=>{
    ukur.style.font=fontStyle.font;
    ukur.style.fontFamily=fontStyle.fontFamily;
    ukur.style.fontSize=fontStyle.fontSize;
    ukur.style.fontWeight=fontStyle.fontWeight;
    ukur.textContent=teks;
    return ukur.getBoundingClientRect().width;
  };
  let kanan=0,kiri=0,nomor=0,jumlah=0;
  try{
    for(const s of dataTerbatas()){
      if(typeof s!=="string")continue;
      const p=s.split("|");if(p.length!==3)continue;
      jumlah++;
      kanan=Math.max(kanan,baca(teks(p[0].trim()),gaya));
      kiri=Math.max(kiri,baca(teks(p[2].trim()),gaya));
      nomor=Math.max(nomor,baca(angkaArab(p[1].trim()),gayaNomor));
    }
  }finally{ukur.remove()}
  if(!jumlah)throw Error("Tidak ada bait yang dapat diukur.");
  const gap=parseFloat(gaya.columnGap)||0;
  return {lebar:Math.ceil(2*Math.max(kanan,kiri)+nomor+2*gap),jumlah,kanan,kiri,nomor};
}
