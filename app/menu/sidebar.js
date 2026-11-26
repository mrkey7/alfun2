(() => {
  "use strict";
  window.initMenuSidebar = async ({ container, el }) => {
    await window.alfiyyahMenu?.ready;
    const section=el("section",{class:"as-section"});
    section.append(el("h3",{class:"as-section-title"},"Pengaturan Menu"));
    const config=window.alfiyyahMenu?.getConfig?.() || {};
    const jump=config.jump||{};
    const preview=config.preview||{};

    const buatCheck=(label,value,ubah)=>{
      const wrap=el("label",{class:"as-check"});
      const input=el("input",{type:"checkbox"});
      input.checked=Boolean(value);
      input.addEventListener("change",()=>ubah(input.checked));
      wrap.append(input,el("span",{},label));
      return wrap;
    };
    const simpan=next=>window.alfiyyahMenu?.updateConfig(next);
    section.append(
      buatCheck("Tampilkan Jump",jump.aktif!==false,value=>simpan({jump:{aktif:value}}))
    );

    const labelWrap=el("label",{class:"as-field"});
    labelWrap.append(el("span",{},"Nama item Jump"));
    const labelInput=el("input",{type:"text"});
    labelInput.value=jump.label||"Jump";
    labelInput.addEventListener("change",()=>simpan({jump:{label:labelInput.value.trim()||"Jump"}}));
    labelWrap.append(labelInput);
    section.append(labelWrap);

    const skalaWrap=el("label",{class:"as-field"});
    const baris=el("span",{});
    baris.append(el("span",{},"Skala preview menu"));
    const output=el("output",{},`${preview.skala||100}%`);
    baris.append(output);
    const skala=el("input",{type:"range",min:"50",max:"250",step:"10"});
    skala.value=String(preview.skala||100);
    skala.addEventListener("input",()=>{
      output.textContent=`${skala.value}%`;
      simpan({preview:{skala:Number(skala.value)}});
    });
    skalaWrap.append(baris,skala);
    section.append(skalaWrap);

    section.append(
      buatCheck("Blur konten di bawah menu",preview.blur,value=>simpan({preview:{blur:value}}))
    );
    const note=el("p",{class:"as-note"},"Daftar tujuan Jump berasal dari konfigurasi global halaman. Halaman aktif dan halaman nonaktif tidak ditampilkan.");
    section.append(note);
    container.append(section);
  };
})();