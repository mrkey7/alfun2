(() => {
  "use strict";

  window.initSampulSidebar = async function (container) {
    const el = (tag, attrs = {}, text = "") => {
      const node = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      if (text) node.textContent = text;
      return node;
    };

    const config = await APP.loadJSON("rules.utama", { cache: "no-store" });
    const sampul = { ...(config.sampul || {}) };

    const form = el("div");
    const showLabel = el("label", { class: "as-check" });
    const show = el("input", { type: "checkbox" });
    show.checked = sampul.tampilkan !== false;
    showLabel.append(show, document.createTextNode("Tampilkan halaman Home"));
    form.append(showLabel);

    const makeRange = (label, key, fallback, max) => {
      const wrap = el("label", { class: "as-field" });
      const line = el("span");
      const name = el("span", {}, label);
      const value = el("output", {}, String(sampul[key] ?? fallback));
      const input = el("input", { type: "range", min: "0", max: String(max), step: "1" });
      input.value = String(Number.isFinite(Number(sampul[key])) ? sampul[key] : fallback);
      line.append(name, value);
      wrap.append(line, input);
      input.addEventListener("input", () => {
        value.textContent = input.value;
        updatePreview();
        setStatus("Ada perubahan yang belum disimpan.");
      });
      return { wrap, input };
    };

    const title = makeRange("Ukuran judul", "judul", 15, 50);
    const author = makeRange("Ukuran penyusun", "penyusun", 2, 30);
    form.append(title.wrap, author.wrap);

    const actions = el("div", { class: "as-actions" });
    const save = el("button", { class: "as-save", type: "button" }, "Simpan");
    const status = el("div", { class: "as-status", role: "status" });
    actions.append(save);
    form.append(actions, status);
    container.replaceChildren(form);

    const preview = document.querySelector(".sampul");
    function updatePreview() {
      if (!preview) return;
      preview.style.setProperty("--judul-tambah", `${Number(title.input.value)}px`);
      preview.style.setProperty("--penyusun-tambah", `${Number(author.input.value)}px`);
    }
    function setStatus(message, type = "") {
      status.textContent = message;
      status.className = "as-status " + type;
    }

    show.addEventListener("change", () => setStatus("Perubahan status Home belum disimpan."));
    updatePreview();

    save.addEventListener("click", async () => {
      save.disabled = true;
      setStatus("Menyimpan…");
      try {
        const data = {
          ...sampul,
          tampilkan: show.checked,
          judul: Number(title.input.value),
          penyusun: Number(author.input.value)
        };
        const result = await fetch(APP.api.saveConfig, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group: "sampul", data })
        });
        const body = await result.json().catch(() => ({}));
        if (!result.ok) throw new Error(body.error || `Gagal menyimpan (HTTP ${result.status})`);
        Object.assign(sampul, data);
        setStatus("Berhasil menyimpan konfigurasi Home.", "success");
      } catch (error) {
        setStatus(error.message + " Pastikan aplikasi dijalankan melalui lokal/run2.py.", "error");
      } finally {
        save.disabled = false;
      }
    });
  };
})();
