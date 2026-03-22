(function () {
  const FB_URL = "https://www.facebook.com/xiaojugardeninghouse";
  /** 舊版意願資料與新品項不一致時自動分開儲存 */
  const STORAGE_KEY = "xiaoju-gardening-wtp-v2";
  const PREORDER_STORAGE_KEY = "xiaoju-preorder-v1";

  function titleFromFilename(file) {
    return file.replace(/\.jpe?g$/i, "").trim();
  }

  /** 子資料夾「金马伦多肉植物（预订单）」內檔名；品名＝檔名去掉副檔名。增刪照片請同步下方筆數或檔名規則。 */
  const CAMELLON_PREORDER_DIR = "金马伦多肉植物（预订单）";
  const CAMELLON_PREORDER_FILES = Array.from({ length: 39 }, (_, i) => `55盆口 编号 ${i + 1}.jpeg`);

  /**
   * 預定產品：圖片在「预定照片」資料夾，價格固定。
   * 若增刪檔案，請同步修改此陣列並放入對應圖片。
   */
  const PREORDER_ENTRIES = [
    {
      id: "pre-1",
      file: "RM12 85CM多肉植物 （金马伦）.jpeg",
      price: 12,
      title: "85CM多肉植物（金马伦）",
      note: "金馬倫 · 固定價 RM12",
    },
    ...CAMELLON_PREORDER_FILES.map((name, i) => ({
      id: `pre-cam-${String(i + 1).padStart(2, "0")}`,
      file: `${CAMELLON_PREORDER_DIR}/${name}`,
      price: 3.8,
      title: titleFromFilename(name),
      note: "金馬倫 · 固定價 RM3.80 · 金马伦多肉植物（预订单）",
    })),
  ];

  const CATEGORY_LABELS = {
    tuotu: "脱土多肉",
    jingpin: "精品多肉",
    wutu: "无土多肉",
    fupen: "服盆多肉",
  };

  const SPEC_BY_CATEGORY = {
    tuotu: "脱土 / 裸根植株（以實物為準）",
    jingpin: "精選品項（以實物為準）",
    wutu: "无土栽培（以實物為準）",
    fupen: "已服盆（以實物為準）",
  };

  /**
   * 檔名與「照片回顾」資料夾內完全一致；商品名稱＝檔名去掉副檔名。
   * cat：tuotu 脱土多肉 / jingpin 精品多肉 / wutu 无土多肉 / fupen 服盆多肉
   */
  const PHOTO_ENTRIES = [
    { file: "山地玫瑰 休眠期.jpg", cat: "tuotu" },
    { file: "山地玫瑰 脱土.jpg", cat: "tuotu" },
    { file: "东云 脱土裸根.jpg", cat: "tuotu" },
    { file: "生石花  0.8-1.5CM.jpg", cat: "jingpin" },
    { file: "红苹果 多肉植物 脱土.jpg", cat: "tuotu" },
    { file: "娜娜小勾 多肉精品.jpg", cat: "jingpin" },
    { file: "娜娜小勾 服盆多肉.jpg", cat: "fupen" },
    { file: "海绵无土 多肉 5CM.jpg", cat: "wutu" },
    { file: "海绵无土 多肉5CM.jpg", cat: "wutu" },
    { file: "海绵精品 三色景.jpg", cat: "jingpin" },
    { file: "海绵精品 月影精灵.jpg", cat: "jingpin" },
    { file: "海绵精品 未知名.jpg", cat: "jingpin" },
    { file: "海绵精品 蓝苹果.jpg", cat: "jingpin" },
    { file: "缀化 吉娃娃 蓝狐 服盆多肉.jpg", cat: "fupen" },
    { file: "脱土 小多肉杂交.jpg", cat: "tuotu" },
    { file: "脱土 多肉植物 混合杂交.jpg", cat: "tuotu" },
    { file: "脱土 红苹果.jpg", cat: "tuotu" },
    { file: "脱土 红粉太阁 新品.jpg", cat: "tuotu" },
    { file: "脱土 紫乐.jpg", cat: "tuotu" },
    { file: "脱土多肉植物 大颗.jpg", cat: "tuotu" },
    { file: "脱土多肉植物 杂交.jpg", cat: "tuotu" },
    { file: "脱土多肉植物 杂交混.jpg", cat: "tuotu" },
    { file: "脱土多肉植物 零售.jpg", cat: "tuotu" },
    { file: "脱土多肉植物.jpg", cat: "tuotu" },
    { file: "脱土裸根 多肉.jpg", cat: "tuotu" },
    { file: "脱土裸根初恋 10CM.jpg", cat: "tuotu" },
    { file: "脱土薄叶蓝鸟 巨大.jpg", cat: "tuotu" },
    { file: "精品脱土 多肉植物.jpg", cat: "jingpin" },
    { file: "蓝苹果 多肉服盆.jpg", cat: "fupen" },
  ];

  const CATEGORIES = [
    { id: "all", label: "全部" },
    { id: "tuotu", label: "脱土多肉" },
    { id: "jingpin", label: "精品多肉" },
    { id: "wutu", label: "无土多肉" },
    { id: "fupen", label: "服盆多肉" },
  ];

  function skuFor(i) {
    return `XJH-${String(i + 1).padStart(3, "0")}`;
  }

  const products = PHOTO_ENTRIES.map((entry, i) => {
    const category = entry.cat;
    return {
      id: i + 1,
      file: entry.file,
      sku: skuFor(i),
      title: titleFromFilename(entry.file),
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

  function countSurveyFilled() {
    const all = loadAllWtp();
    return Object.values(all).filter((e) => e && e.wtp != null && String(e.wtp).trim() !== "").length;
  }

  function loadPreorder() {
    try {
      return JSON.parse(localStorage.getItem(PREORDER_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function savePreorderQty(preId, qty) {
    const all = loadPreorder();
    const n = parseInt(String(qty), 10);
    if (Number.isNaN(n) || n < 0) return;
    if (n === 0) {
      delete all[preId];
    } else {
      all[preId] = { qty: n, updatedAt: new Date().toISOString() };
    }
    localStorage.setItem(PREORDER_STORAGE_KEY, JSON.stringify(all));
  }

  function getPreorderQty(preId) {
    const e = loadPreorder()[preId];
    return e && e.qty != null ? String(e.qty) : "";
  }

  function countPreorderFilled() {
    const all = loadPreorder();
    return Object.values(all).filter((e) => e && parseInt(String(e.qty), 10) > 0).length;
  }

  function updateRecordCount() {
    const n = countSurveyFilled() + countPreorderFilled();
    if (wtpCountEl) wtpCountEl.textContent = String(n);
  }

  let viewMode = "survey";
  let activeCategory = "all";
  let sortMode = "default";

  const gridEl = document.getElementById("product-grid");
  const searchInput = document.getElementById("search-input");
  const toastEl = document.getElementById("toast");
  const filterWrap = document.getElementById("filter-btns");
  const sortBtns = document.querySelectorAll("[data-sort]");
  const navCats = document.querySelectorAll(".nav-cats a[data-cat]");
  const productTotalEl = document.getElementById("product-total");
  const preorderTotalEl = document.getElementById("preorder-total");
  const wtpCountEl = document.getElementById("wtp-count");
  const surveySection = document.getElementById("survey-section");
  const preorderSection = document.getElementById("preorder-section");
  const preorderGridEl = document.getElementById("preorder-grid");
  const filterHeading = document.getElementById("filter-heading");
  const filterPreorderNote = document.getElementById("filter-preorder-note");
  const summaryBtn = document.getElementById("summary-btn");
  const summaryDialog = document.getElementById("summary-dialog");
  const summaryBody = document.getElementById("summary-body");
  const copySummaryBtn = document.getElementById("copy-summary");
  const clearAllBtn = document.getElementById("clear-all-wtp");
  const closeSummaryBtn = document.getElementById("close-summary");

  if (productTotalEl) {
    productTotalEl.textContent = String(products.length);
  }
  if (preorderTotalEl) {
    preorderTotalEl.textContent = String(PREORDER_ENTRIES.length);
  }

  function updateWtpCount() {
    updateRecordCount();
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

  /** 預定照片路徑可含子資料夾，需分段 encode，不可整段 encodeURIComponent（會破壞 /）。 */
  function preorderPhotoSrc(file) {
    return "预定照片/" + file.split("/").map(encodeURIComponent).join("/");
  }

  function filteredPreorderList() {
    const q = (searchInput.value || "").trim().toLowerCase();
    return PREORDER_ENTRIES.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.file.toLowerCase().includes(q) ||
        p.note.toLowerCase().includes(q)
      );
    });
  }

  function renderPreorderGrid() {
    const list = filteredPreorderList();
    if (!preorderGridEl) return;
    if (!list.length) {
      preorderGridEl.innerHTML =
        '<div class="empty-hint">沒有符合的預定品項，請換個關鍵字試試。</div>';
      return;
    }

    preorderGridEl.innerHTML = list
      .map(
        (p) => `
      <article class="product-card product-card--preorder" data-preid="${escapeHtml(p.id)}">
        <div class="thumb">
          <img src="${preorderPhotoSrc(p.file)}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="400" />
        </div>
        <div class="info">
          <h3 class="title">${escapeHtml(p.title)}</h3>
          <div class="preorder-price-block">
            <span class="preorder-price">RM ${Number(p.price).toFixed(2)}</span>
            <span class="preorder-price-tag">固定價</span>
          </div>
          <p class="preorder-note">${escapeHtml(p.note)}</p>
          <form class="preorder-form" data-preid="${escapeHtml(p.id)}" novalidate>
            <label class="preorder-label" for="pqty-${escapeHtml(p.id)}">預定數量</label>
            <div class="preorder-row">
              <input
                class="preorder-qty-input"
                id="pqty-${escapeHtml(p.id)}"
                name="qty"
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                placeholder="0"
                autocomplete="off"
              />
              <button type="submit" class="preorder-submit">儲存預定</button>
            </div>
            <p class="wtp-hint">數量儲存於本機；改為 0 並儲存可清除該項。</p>
          </form>
        </div>
      </article>
    `
      )
      .join("");

    preorderGridEl.querySelectorAll(".preorder-form").forEach((form) => {
      const preId = form.getAttribute("data-preid");
      const input = form.querySelector('[name="qty"]');
      const saved = getPreorderQty(preId);
      if (saved) input.value = saved;

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const raw = (input.value || "").trim();
        const n = raw === "" ? 0 : parseInt(raw, 10);
        if (Number.isNaN(n) || n < 0) {
          showToast("請輸入 0 或以上的整數");
          return;
        }
        savePreorderQty(preId, n);
        updateRecordCount();
        const item = PREORDER_ENTRIES.find((x) => x.id === preId);
        if (n === 0) {
          showToast(`已清除「${item.title}」預定`);
        } else {
          showToast(`已記錄「${item.title}」× ${n}（RM ${(item.price * n).toFixed(2)} 小計）`);
        }
        renderPreorderGrid();
      });
    });
  }

  function switchMode(mode) {
    viewMode = mode;
    document.querySelectorAll(".mode-tab").forEach((tab) => {
      const active = tab.getAttribute("data-mode") === mode;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (surveySection) surveySection.hidden = mode !== "survey";
    if (preorderSection) preorderSection.hidden = mode !== "preorder";
    if (filterHeading) filterHeading.hidden = mode !== "survey";
    if (filterWrap) filterWrap.hidden = mode !== "survey";
    if (filterPreorderNote) filterPreorderNote.hidden = mode !== "preorder";
    if (mode === "preorder") {
      renderPreorderGrid();
    } else {
      renderGrid();
    }
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
    const pre = loadPreorder();
    const parts = [];

    const surveyRows = products
      .filter((p) => all[String(p.id)] && String(all[String(p.id)].wtp).trim() !== "")
      .map((p) => {
        const w = all[String(p.id)].wtp;
        return `<tr><td>${escapeHtml(p.sku)}</td><td>${escapeHtml(p.title)}</td><td class="num">RM ${escapeHtml(w)}</td></tr>`;
      });
    if (surveyRows.length) {
      parts.push(
        '<h3 class="summary-section-h">購買意願調查（自填願付價）</h3>' +
          '<table class="summary-table"><thead><tr><th>货号</th><th>項目</th><th>願付金額</th></tr></thead><tbody>' +
          surveyRows.join("") +
          "</tbody></table>"
      );
    }

    const preRows = PREORDER_ENTRIES.filter((p) => pre[p.id] && parseInt(String(pre[p.id].qty), 10) > 0).map(
      (p) => {
        const q = parseInt(String(pre[p.id].qty), 10);
        const sub = p.price * q;
        return `<tr><td>${escapeHtml(p.title)}</td><td class="num">RM ${Number(p.price).toFixed(2)}</td><td class="num">${q}</td><td class="num">RM ${sub.toFixed(2)}</td></tr>`;
      }
    );
    if (preRows.length) {
      parts.push(
        '<h3 class="summary-section-h">預定產品（固定價）</h3>' +
          '<table class="summary-table"><thead><tr><th>品名</th><th>單價</th><th>數量</th><th>小計</th></tr></thead><tbody>' +
          preRows.join("") +
          "</tbody></table>"
      );
    }

    if (!parts.length) {
      summaryBody.innerHTML = "<p class=\"summary-empty\">尚未記錄任何意願或預定。</p>";
      return;
    }
    summaryBody.innerHTML = parts.join("");
  }

  function buildSummaryText() {
    const all = loadAllWtp();
    const pre = loadPreorder();
    const lines = ["Xiaoju Gardening House · 已記錄清單", ""];

    lines.push("【購買意願調查】");
    lines.push("货号\t項目\t願付(RM)");
    products.forEach((p) => {
      const e = all[String(p.id)];
      if (e && String(e.wtp).trim() !== "") {
        lines.push(`${p.sku}\t${p.title.replace(/\t/g, " ")}\t${e.wtp}`);
      }
    });

    lines.push("");
    lines.push("【預定產品（固定價）】");
    lines.push("品名\t單價(RM)\t數量\t小計(RM)");
    PREORDER_ENTRIES.forEach((p) => {
      const e = pre[p.id];
      if (e && parseInt(String(e.qty), 10) > 0) {
        const q = parseInt(String(e.qty), 10);
        const sub = p.price * q;
        lines.push(`${p.title.replace(/\t/g, " ")}\t${Number(p.price).toFixed(2)}\t${q}\t${sub.toFixed(2)}`);
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
      if (!a.dataset.cat) return;
      e.preventDefault();
      switchMode("survey");
      activeCategory = a.dataset.cat;
      filterWrap.querySelectorAll(".filter-btn").forEach((x) => {
        x.classList.toggle("active", x.dataset.cat === activeCategory);
      });
      navCats.forEach((n) => n.classList.toggle("active", n === a));
      renderGrid();
    });
  });

  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.getAttribute("data-mode");
      if (mode === "survey" || mode === "preorder") switchMode(mode);
    });
  });

  sortBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      sortMode = btn.dataset.sort;
      sortBtns.forEach((b) => b.classList.toggle("active", b === btn));
      renderGrid();
    });
  });

  searchInput.addEventListener("input", () => {
    if (viewMode === "preorder") renderPreorderGrid();
    else renderGrid();
  });
  document.getElementById("search-btn").addEventListener("click", () => {
    if (viewMode === "preorder") renderPreorderGrid();
    else renderGrid();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (viewMode === "preorder") renderPreorderGrid();
      else renderGrid();
    }
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
    if (!countSurveyFilled() && !countPreorderFilled()) {
      showToast("目前沒有已記錄的意願或預定");
      return;
    }
    if (!confirm("確定要清除本機儲存的全部「購買意願」與「預定產品」嗎？此動作無法復原。")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREORDER_STORAGE_KEY);
    updateWtpCount();
    fillSummaryBody();
    renderGrid();
    renderPreorderGrid();
    showToast("已清除全部記錄");
  });

  renderGrid();
  updateWtpCount();

  const chatFab = document.getElementById("chat-fab");
  const chatPanel = document.getElementById("chat-panel");
  const chatClose = document.getElementById("chat-close");
  const chatWidget = document.getElementById("chat-widget");
  const chatWelcome = document.getElementById("chat-welcome");
  const chatFaqWrap = document.getElementById("chat-faq-wrap");
  const chatPanelTitle = document.getElementById("chat-panel-title");
  const chatAvatarBtn = document.getElementById("chat-avatar-btn");
  const chatDismissWelcome = document.getElementById("chat-dismiss-welcome");
  const chatDismissFaq = document.getElementById("chat-dismiss-faq");

  function resetChatPanel() {
    if (!chatPanel) return;
    if (chatWelcome) chatWelcome.hidden = false;
    if (chatFaqWrap) chatFaqWrap.hidden = true;
    if (chatPanelTitle) chatPanelTitle.textContent = "智能小助手";
    chatPanel.querySelectorAll("details.chat-faq").forEach((d) => {
      d.open = false;
    });
  }

  function showChatFaq() {
    if (chatWelcome) chatWelcome.hidden = true;
    if (chatFaqWrap) chatFaqWrap.hidden = false;
    if (chatPanelTitle) chatPanelTitle.textContent = "智能小助手 · 常見問題";
  }

  function setChatOpen(open) {
    if (!chatPanel || !chatFab) return;
    chatPanel.hidden = !open;
    chatPanel.setAttribute("aria-hidden", open ? "false" : "true");
    chatFab.setAttribute("aria-expanded", open ? "true" : "false");
    chatFab.setAttribute("aria-label", open ? "關閉小助手" : "開啟智能小助手");
    if (open) resetChatPanel();
    else resetChatPanel();
  }

  function closeChatPanel(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setChatOpen(false);
  }

  if (chatFab && chatPanel) {
    chatPanel.setAttribute("aria-hidden", "true");
    chatFab.addEventListener("click", (e) => {
      e.stopPropagation();
      setChatOpen(chatPanel.hidden);
    });
    chatClose?.addEventListener("click", closeChatPanel);
    chatAvatarBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      showChatFaq();
    });
    chatDismissWelcome?.addEventListener("click", closeChatPanel);
    chatDismissFaq?.addEventListener("click", closeChatPanel);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !chatPanel.hidden) closeChatPanel(e);
    });
    document.addEventListener("click", (e) => {
      if (chatPanel.hidden || !chatWidget) return;
      if (!chatWidget.contains(e.target)) closeChatPanel();
    });
    chatPanel.querySelectorAll("details.chat-faq").forEach((d) => {
      d.addEventListener("toggle", () => {
        if (!d.open) return;
        chatPanel.querySelectorAll("details.chat-faq").forEach((o) => {
          if (o !== d) o.open = false;
        });
      });
    });
  }

  window.__XIAOJU_SURVEY__ = {
    FB_URL,
    products,
    PREORDER_ENTRIES,
    loadAllWtp,
    loadPreorder,
    STORAGE_KEY,
    PREORDER_STORAGE_KEY,
  };
})();
