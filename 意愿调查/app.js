(function () {
  const FB_URL = "https://www.facebook.com/xiaojugardeninghouse";
  const STORAGE_KEY = "xiaoju-gardening-wtp-v1";

  const CATEGORY_LABELS = {
    succulent: "小型多肉植物",
    pot: "植物花盆",
    landscape: "小型景觀植物",
  };

  const SPEC_BY_CATEGORY = {
    succulent: "小型盆栽 · 盆徑約 5–12cm（以實物為準）",
    pot: "花盆 · 材質／尺寸以實物為準",
    landscape: "小型景觀植栽 · 適合桌邊／陽台佈置",
  };

  const PHOTOS = [
    "20210726_133547.jpg",
    "20210730_114200.jpg",
    "20211005_140933.jpg",
    "20220301_173826.jpg",
    "20220301_173848.jpg",
    "20220301_173906.jpg",
    "20220301_173935.jpg",
    "20220322_124436.jpg",
    "20220322_190445.jpg",
    "20220322_190544.jpg",
    "20220322_190608.jpg",
    "20220322_190652.jpg",
    "20220322_190741.jpg",
    "20220322_191238.jpg",
    "20220414_220224.jpg",
    "20220414_220228.jpg",
    "20220418_175259.jpg",
    "20220419_135912.jpg",
    "20220419_135923.jpg",
    "20220419_164957.jpg",
    "20220420_114659.jpg",
    "20220420_215130.jpg",
    "20220421_194348.jpg",
    "20220517_184059.jpg",
    "20220528_121810.jpg",
    "20220528_123111.jpg",
    "20220612_100629.jpg",
    "20220612_144408.jpg",
    "FB_IMG_1650542009451.jpg",
  ];

  const CATEGORIES = [
    { id: "all", label: "全部" },
    { id: "succulent", label: "小型多肉植物" },
    { id: "pot", label: "植物花盆" },
    { id: "landscape", label: "小型景觀植物" },
  ];

  const baseTitles = [
    "店內實拍 · 多肉組合",
    "小居精選盆栽",
    "居家小賣鋪 · 植物現貨",
    "站點取貨 · 預定款",
    "玉露 / 多肉盆栽",
    "花盆搭配組",
    "小型景觀植栽",
    "Sibu 本店實拍",
  ];

  function categoryForIndex(i) {
    const r = i % 3;
    if (r === 0) return "succulent";
    if (r === 1) return "pot";
    return "landscape";
  }

  function skuFor(i) {
    return `XJH-${String(i + 1).padStart(3, "0")}`;
  }

  const products = PHOTOS.map((file, i) => {
    const category = categoryForIndex(i);
    return {
      id: i + 1,
      file,
      sku: skuFor(i),
      title: `${baseTitles[i % baseTitles.length]}（${i + 1}）`,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      specDetail: SPEC_BY_CATEGORY[category],
    };
  });

  function loadAllWtp() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveWtpEntry(id, wtpStr) {
    const all = loadAllWtp();
    const key = String(id);
    if (wtpStr == null || wtpStr === "") {
      delete all[key];
    } else {
      all[key] = { wtp: wtpStr, updatedAt: new Date().toISOString() };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function getWtpValue(id) {
    const e = loadAllWtp()[String(id)];
    return e && e.wtp != null ? String(e.wtp) : "";
  }

  function hasWtp(id) {
    const v = getWtpValue(id);
    return v.trim() !== "";
  }

  function countFilled() {
    const all = loadAllWtp();
    return Object.values(all).filter((e) => e && e.wtp != null && String(e.wtp).trim() !== "").length;
  }

  let activeCategory = "all";
  let sortMode = "default";

  const gridEl = document.getElementById("product-grid");
  const searchInput = document.getElementById("search-input");
  const toastEl = document.getElementById("toast");
  const filterWrap = document.getElementById("filter-btns");
  const sortBtns = document.querySelectorAll("[data-sort]");
  const navCats = document.querySelectorAll(".nav-cats a[data-cat]");
  const productTotalEl = document.getElementById("product-total");
  const wtpCountEl = document.getElementById("wtp-count");
  const summaryBtn = document.getElementById("summary-btn");
  const summaryDialog = document.getElementById("summary-dialog");
  const summaryBody = document.getElementById("summary-body");
  const copySummaryBtn = document.getElementById("copy-summary");
  const clearAllBtn = document.getElementById("clear-all-wtp");
  const closeSummaryBtn = document.getElementById("close-summary");

  if (productTotalEl) {
    productTotalEl.textContent = String(products.length);
  }

  function updateWtpCount() {
    if (wtpCountEl) wtpCountEl.textContent = String(countFilled());
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function filteredList() {
    const q = (searchInput.value || "").trim().toLowerCase();
    let list = products.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.file.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryLabel.includes(q)
      );
    });

    if (sortMode === "id-asc") {
      list = [...list].sort((a, b) => a.id - b.id);
    } else if (sortMode === "id-desc") {
      list = [...list].sort((a, b) => b.id - a.id);
    } else if (sortMode === "filled-first") {
      list = [...list].sort((a, b) => {
        const fa = hasWtp(a.id) ? 1 : 0;
        const fb = hasWtp(b.id) ? 1 : 0;
        if (fb !== fa) return fb - fa;
        return a.id - b.id;
      });
    } else {
      list = [...list].sort((a, b) => a.id - b.id);
    }

    return list;
  }

  function bindWtpForms() {
    gridEl.querySelectorAll(".wtp-form").forEach((form) => {
      const id = parseInt(form.getAttribute("data-pid"), 10);
      const input = form.querySelector('[name="wtp"]');
      const saved = getWtpValue(id);
      if (saved) input.value = saved;

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const raw = (input.value || "").trim().replace(",", ".");
        if (raw === "") {
          saveWtpEntry(id, null);
          updateWtpCount();
          renderGrid();
          showToast("已清除此項意願");
          return;
        }
        const num = parseFloat(raw);
        if (Number.isNaN(num) || num < 0) {
          showToast("請輸入有效的金額（RM，可為 0）");
          return;
        }
        const normalized = num.toFixed(2);
        saveWtpEntry(id, normalized);
        updateWtpCount();
        const p = products.find((x) => x.id === id);
        showToast(`已記錄 ${p.sku}：願付 RM ${normalized}`);
        renderGrid();
      });
    });
  }

  function renderGrid() {
    const list = filteredList();
    if (!list.length) {
      gridEl.innerHTML = '<div class="empty-hint">沒有符合的項目，請換個分類或關鍵字試試。</div>';
      return;
    }

    gridEl.innerHTML = list
      .map(
        (p) => `
      <article class="product-card" data-id="${p.id}">
        <div class="thumb">
          <img src="照片回顾/${encodeURIComponent(p.file)}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="400" />
        </div>
        <div class="info">
          <h3 class="title">${escapeHtml(p.title)}</h3>
          <dl class="product-spec">
            <div class="row"><dt>货号</dt><dd>${escapeHtml(p.sku)}</dd></div>
            <div class="row"><dt>类目</dt><dd>${escapeHtml(p.categoryLabel)}</dd></div>
            <div class="row"><dt>规格</dt><dd>${escapeHtml(p.specDetail)}</dd></div>
          </dl>
          <form class="wtp-form" data-pid="${p.id}" novalidate>
            <label class="wtp-label" for="wtp-${p.id}">您願意支付（RM）</label>
            <div class="wtp-row">
              <input
                class="wtp-input"
                id="wtp-${p.id}"
                name="wtp"
                type="text"
                inputmode="decimal"
                placeholder="例如 28.90"
                autocomplete="off"
                aria-describedby="wtp-hint-${p.id}"
              />
              <button type="submit" class="wtp-submit">送出意願</button>
            </div>
            <p class="wtp-hint" id="wtp-hint-${p.id}">送出後儲存於本機；留空並送出可清除該項。</p>
          </form>
        </div>
      </article>
    `
      )
      .join("");

    bindWtpForms();
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fillSummaryBody() {
    const all = loadAllWtp();
    const rows = products
      .filter((p) => all[String(p.id)] && String(all[String(p.id)].wtp).trim() !== "")
      .map((p) => {
        const w = all[String(p.id)].wtp;
        return `<tr><td>${escapeHtml(p.sku)}</td><td>${escapeHtml(p.title)}</td><td class="num">RM ${escapeHtml(w)}</td></tr>`;
      });
    if (!rows.length) {
      summaryBody.innerHTML = "<p class=\"summary-empty\">尚未記錄任何意願。</p>";
      return;
    }
    summaryBody.innerHTML =
      '<table class="summary-table"><thead><tr><th>货号</th><th>項目</th><th>願付金額</th></tr></thead><tbody>' +
      rows.join("") +
      "</tbody></table>";
  }

  function buildSummaryText() {
    const all = loadAllWtp();
    const lines = ["Xiaoju Gardening House · 購買意願調查", "货号\t項目\t願付(RM)"];
    products.forEach((p) => {
      const e = all[String(p.id)];
      if (e && String(e.wtp).trim() !== "") {
        lines.push(`${p.sku}\t${p.title.replace(/\t/g, " ")}\t${e.wtp}`);
      }
    });
    return lines.join("\n");
  }

  CATEGORIES.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "filter-btn" + (c.id === activeCategory ? " active" : "");
    b.textContent = c.label;
    b.dataset.cat = c.id;
    filterWrap.appendChild(b);
  });

  filterWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    filterWrap.querySelectorAll(".filter-btn").forEach((x) => {
      x.classList.toggle("active", x.dataset.cat === activeCategory);
    });
    navCats.forEach((a) => {
      a.classList.toggle("active", a.dataset.cat === activeCategory);
    });
    renderGrid();
  });

  navCats.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      activeCategory = a.dataset.cat;
      filterWrap.querySelectorAll(".filter-btn").forEach((x) => {
        x.classList.toggle("active", x.dataset.cat === activeCategory);
      });
      navCats.forEach((n) => n.classList.toggle("active", n === a));
      renderGrid();
    });
  });

  sortBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      sortMode = btn.dataset.sort;
      sortBtns.forEach((b) => b.classList.toggle("active", b === btn));
      renderGrid();
    });
  });

  searchInput.addEventListener("input", () => renderGrid());
  document.getElementById("search-btn").addEventListener("click", () => renderGrid());
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") renderGrid();
  });

  summaryBtn.addEventListener("click", () => {
    fillSummaryBody();
    if (summaryDialog.showModal) summaryDialog.showModal();
  });

  closeSummaryBtn.addEventListener("click", () => summaryDialog.close());

  summaryDialog.addEventListener("click", (e) => {
    if (e.target === summaryDialog) summaryDialog.close();
  });

  copySummaryBtn.addEventListener("click", async () => {
    const text = buildSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      showToast("已複製清單到剪貼簿");
    } catch {
      showToast("複製失敗，請手動選取表格內容");
    }
  });

  clearAllBtn.addEventListener("click", () => {
    if (!countFilled()) {
      showToast("目前沒有已記錄的意願");
      return;
    }
    if (!confirm("確定要清除本機儲存的全部購買意願嗎？此動作無法復原。")) return;
    localStorage.removeItem(STORAGE_KEY);
    updateWtpCount();
    fillSummaryBody();
    renderGrid();
    showToast("已清除全部意願");
  });

  renderGrid();
  updateWtpCount();

  window.__XIAOJU_SURVEY__ = { FB_URL, products, loadAllWtp, STORAGE_KEY };
})();
