(function () {
  const FB_URL = "https://www.facebook.com/xiaojugardeninghouse";
  /** 舊版意願資料與新品項不一致時自動分開儲存 */
  const STORAGE_KEY = "xiaoju-gardening-wtp-v2";
  const PREORDER_STORAGE_KEY = "xiaoju-preorder-v1";
  const USER_NAME_KEY = "xiaoju-user-name-v1";
  const ARCHIVE_STORAGE_KEY = "xiaoju-archive-v1";
  const ADMIN_STORAGE_KEY = "xiaoju-admin-products-v2"; // 管理員新增商品儲存
  const ADMIN_PREORDER_KEY = "xiaoju-admin-preorder-v1"; // 管理員新增預定商品儲存
  const ADMIN_ARCHIVE_KEY = "xiaoju-admin-archive-v1";   // 管理員新增回顧商品儲存
  const ORDERS_STORAGE_KEY = "xiaoju-orders-v1";       // 訂單追蹤數據儲存

  // 管理員帳密驗證
  const ADMIN_CREDENTIALS = { user: "XIAOJU", pass: "XIAOJU" };

  // Supabase 配置
  const SUPABASE_URL = "https://tmjgeolrkybqzfgybrjz.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_BpO8aIJlFai-vLP2K6ptBw_X_31DqYY";
  let supabase = null;
  try {
    if (window.supabase && SUPABASE_ANON_KEY) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch (e) {
    console.error("Supabase initialization failed:", e);
  }

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
  const DEFAULT_PREORDER_ENTRIES = [
    {
      id: "pre-1",
      file: "RM12 85CM多肉植物 （金马伦）.jpeg",
      price: 12,
      title: "85CM多肉植物（金马伦）",
      note: "金馬倫 · 固定價 RM12",
      img: "预定照片/RM12 85CM多肉植物 （金马伦）.jpeg"
    },
    ...CAMELLON_PREORDER_FILES.map((name, i) => ({
      id: `pre-cam-${String(i + 1).padStart(2, "0")}`,
      file: `${CAMELLON_PREORDER_DIR}/${name}`,
      price: 3.8,
      title: titleFromFilename(name),
      note: "金馬倫 · 固定價 RM3.80 · 金马伦多肉植物（预订单）",
      img: `预定照片/${CAMELLON_PREORDER_DIR}/${name}`
    })),
  ];

  function getCombinedPreorder() {
    const adminPre = JSON.parse(localStorage.getItem(ADMIN_PREORDER_KEY) || "[]");
    const defaults = DEFAULT_PREORDER_ENTRIES.map(p => ({ ...p, isDefault: true, sortOrder: 0 }));
    const combined = [...defaults, ...adminPre];
    return combined.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
  }

  let PREORDER_ENTRIES = getCombinedPreorder();

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
  const DEFAULT_PHOTO_ENTRIES = [
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

  function getCombinedProducts() {
    const adminProds = JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || "[]");
    const defaults = DEFAULT_PHOTO_ENTRIES.map((p, i) => ({
      id: `p-${i + 1}`,
      file: p.file,
      sku: `XJH-${String(i + 1).padStart(3, "0")}`,
      title: titleFromFilename(p.file),
      category: p.cat,
      categoryLabel: CATEGORY_LABELS[p.cat],
      specDetail: SPEC_BY_CATEGORY[p.cat],
      img: `照片回顾/${p.file}`,
      isDefault: true,
      sortOrder: 0
    }));
    
    const combined = [...defaults, ...adminProds];
    // 按 sortOrder 置頂 (較大的數字排前面)，再按原本順序
    return combined.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
  }

  let products = getCombinedProducts();

  /**
   * 商品回顧：圖片在「2026-03-22 多肉照片」資料夾。
   */
  const ARCHIVE_DIR = "2026-03-22 多肉照片";

  /**
   * 公告板內容配置
   */
  const BILLBOARD_STORAGE_KEY = "xiaoju-billboard-content-v1";
  let ANNOUNCEMENT = {
    show: true,
    badge: "最新公告",
    title: "歡迎來到小居園藝屋！",
    text: "我們為您挑選了最優質的多肉植物。現在您可以瀏覽「商品回顧」來挑選心儀的品項，或是在「預定產品」中直接下單金馬倫多肉。",
    img: "头像/bg-search.png",
    btnText: "了解更多",
    btnLink: "#",
  };

  async function loadAnnouncement() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('billboard')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error("Error fetching announcement:", error);
        }
        return;
      }

      if (data) {
        ANNOUNCEMENT = {
          show: data.show ?? true,
          badge: data.badge || ANNOUNCEMENT.badge,
          title: data.title || ANNOUNCEMENT.title,
          text: data.text || ANNOUNCEMENT.text,
          img: data.img || ANNOUNCEMENT.img,
          btnText: data.btn_text || ANNOUNCEMENT.btnText,
          btnLink: data.btn_link || ANNOUNCEMENT.btnLink
        };
      }
    } catch (e) {
      console.error("Supabase announcement fetch failed:", e);
    }
  }

  // 初始化時嘗試從本地恢復備份，但隨後會被 Supabase 覆蓋
  try {
    const local = JSON.parse(localStorage.getItem(BILLBOARD_STORAGE_KEY));
    if (local) ANNOUNCEMENT = { ...ANNOUNCEMENT, ...local };
  } catch (e) {}
  const DEFAULT_ARCHIVE_FILES = [
    "WhatsApp Image 2026-03-04 at 09.01.40 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.40 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.40.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.41 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.41.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.42 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.42 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.42 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.42.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.43 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.43.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.44 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.44.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.45 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.45 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.45 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.45.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.46 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.46 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.46.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.47 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.47 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.47 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.47 (4).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.47.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.48 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.48 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.48.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.49 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.49 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.49 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.49.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.50 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.50 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.50 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.50.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.51 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.51 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.51 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.51.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.52 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.52 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.52 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.52.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.53 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.53 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.53 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.53.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.54 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.54 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.54.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.55 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.55 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.55 (3).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.55.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.56 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.56 (2).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.56.jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.57 (1).jpeg",
    "WhatsApp Image 2026-03-04 at 09.01.57.jpeg",
  ];

  function getCombinedArchive() {
    const adminArc = JSON.parse(localStorage.getItem(ADMIN_ARCHIVE_KEY) || "[]");
    const defaults = DEFAULT_ARCHIVE_FILES.map((file, i) => ({
      id: `arc-${String(i + 1).padStart(3, "0")}`,
      file,
      title: `歷史回顧 ${i + 1} (3/4/2026)`,
      img: `${ARCHIVE_DIR}/${file}`,
      isDefault: true,
      sortOrder: 0
    }));
    const combined = [...defaults, ...adminArc];
    return combined.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
  }

  let ARCHIVE_ENTRIES = getCombinedArchive();

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

  function loadArchive() {
    try {
      return JSON.parse(localStorage.getItem(ARCHIVE_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveArchiveWant(arcId, want) {
    const all = loadArchive();
    if (!want) {
      delete all[arcId];
    } else {
      all[arcId] = { want: true, updatedAt: new Date().toISOString() };
    }
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(all));
  }

  function getArchiveWant(arcId) {
    const e = loadArchive()[arcId];
    return !!(e && e.want);
  }

  function countArchiveFilled() {
    const all = loadArchive();
    return Object.values(all).filter((e) => e && e.want).length;
  }

  // --- 訂單管理邏輯 ---
  function loadOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function deleteOrder(id) {
    let orders = loadOrders();
    orders = orders.filter(o => o.id !== id);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    renderOrderList();
    showToast("訂單已刪除");
  }

  function clearOrders() {
    if (!confirm("確定要清空所有訂單記錄嗎？此動作無法復原。")) return;
    localStorage.setItem(ORDERS_STORAGE_KEY, "[]");
    renderOrderList();
    showToast("所有訂單記錄已清空");
  }

  function updateRecordCount() {
    const n = countSurveyFilled() + countPreorderFilled() + countArchiveFilled();
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
  const archiveTotalEl = document.getElementById("archive-total");
  const ordersTotalEl = document.getElementById("orders-total");
  const ordersTbody = document.getElementById("orders-tbody");
  const orderTrackingTab = document.getElementById("order-tracking-tab");
  const ordersSection = document.getElementById("orders-section");
  const wtpCountEl = document.getElementById("wtp-count");
  const surveySection = document.getElementById("survey-section");
  const preorderSection = document.getElementById("preorder-section");
  const archiveSection = document.getElementById("archive-section");
  const preorderGridEl = document.getElementById("preorder-grid");
  const archiveGridEl = document.getElementById("archive-grid");

  // 管理員功能相關元素
  const adminLoginTrigger = document.getElementById("admin-login-trigger");
  const adminLogoutTrigger = document.getElementById("admin-logout-trigger");
  const adminLoginDialog = document.getElementById("admin-login-dialog");
  const adminLoginForm = document.getElementById("admin-login-form");
  const closeAdminLogin = document.getElementById("close-admin-login");
  
  const adminActionsBar = document.getElementById("admin-actions-bar");
  const addProductBtn = document.getElementById("add-product-btn");
  const productEditDialog = document.getElementById("product-edit-dialog");
  const productEditForm = document.getElementById("product-edit-form");
  const closeProductEdit = document.getElementById("close-product-edit");
  const productDialogTitle = document.getElementById("product-dialog-title");

  const addManualOrderBtn = document.getElementById("add-manual-order-btn");
  const orderManualDialog = document.getElementById("order-manual-dialog");
  const orderManualForm = document.getElementById("order-manual-form");
  const closeOrderManual = document.getElementById("close-order-manual");
  const preorderDatalist = document.getElementById("preorder-list");
  const orderManualItemsContainer = document.getElementById("order-manual-items-container");

  let isAdmin = false; // 預設為未登入，重新整理頁後會自動退出

  function updateOrderManualPreview(previewEl, src) {
    if (!previewEl) return;
    if (src) {
      previewEl.innerHTML = `<img src="${src}" alt="Preview">`;
    } else {
      previewEl.innerHTML = `<svg class="placeholder-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    }
  }

  function updateAdminUI() {
    if (isAdmin) {
      adminLoginTrigger.hidden = true;
      adminLogoutTrigger.hidden = false;
      adminActionsBar.hidden = false;
      if (orderTrackingTab) orderTrackingTab.hidden = false;
      document.body.classList.add("is-admin-mode");
    } else {
      adminLoginTrigger.hidden = false;
      adminLogoutTrigger.hidden = true;
      adminActionsBar.hidden = true;
      if (orderTrackingTab) orderTrackingTab.hidden = true;
      document.body.classList.remove("is-admin-mode");
      // 如果目前在訂單頁面但登出了，切換回調查頁面
      if (viewMode === "orders") switchMode("survey");
    }
    renderGrid(); 
    renderPreorderGrid();
    renderArchiveGrid();
    renderOrderList(); // Async but fine here
    renderBillboard(); // 登入狀態改變時重新渲染公告板以顯示/隱藏編輯按鈕
    
    // 更新總數統計
    if (productTotalEl) productTotalEl.textContent = String(products.length);
    if (preorderTotalEl) preorderTotalEl.textContent = String(PREORDER_ENTRIES.length);
    if (archiveTotalEl) archiveTotalEl.textContent = String(ARCHIVE_ENTRIES.length);
  }

  const manualItemPicker = document.getElementById("manual-item-picker");
  const manualSearchResults = document.getElementById("manual-search-results");

  // 填充手動訂單建議列表
  function populatePreorderDatalist() {
    // 使用所有類型的產品資料作為建議來源，但優先顯示「預定產品」
    const allOptions = [
      ...PREORDER_ENTRIES.map(p => ({ title: p.title, sku: p.sku || "PRE-ORDER", img: p.img, type: 'preorder' })),
      ...products.map(p => ({ title: p.title, sku: p.sku, img: p.img, type: 'survey' })),
      ...ARCHIVE_ENTRIES.map(p => ({ title: p.title, sku: p.sku || "ARCHIVE", img: p.img, type: 'archive' }))
    ];
    
    // 去重
    const seen = new Set();
    const uniqueOptions = allOptions.filter(o => {
      if (seen.has(o.title)) return false;
      seen.add(o.title);
      return true;
    });

    // 儲存選項供後續快速選取
    window.__XIAOJU_SURVEY__.allOptions = uniqueOptions;
  }

  // 手動錄入訂單
  addManualOrderBtn?.addEventListener("click", () => {
    populatePreorderDatalist();
    orderManualDialog?.showModal();
  });

  const btnClearManualList = document.getElementById("btn-clear-manual-list");

  // 動態添加品種
  function addManualOrderItem(itemData = null) {
    if (!orderManualItemsContainer) return;
    const items = orderManualItemsContainer.querySelectorAll(".order-manual-item");
    const newIndex = items.length + 1;
    
    const itemDiv = document.createElement("div");
    itemDiv.className = "order-manual-item";
    itemDiv.innerHTML = `
      <div class="item-header">
        <h4 class="item-index">品種 ${newIndex}</h4>
        <button type="button" class="btn-remove-item" title="移除此項">移除</button>
      </div>
      <div class="manual-item-grid">
        <div class="form-group title-group">
          <label>品種名稱</label>
          <input type="text" name="title" class="order-manual-title" required value="${escapeHtml(itemData?.title || "")}" placeholder="名稱">
        </div>
        <div class="form-group sku-group">
          <label>貨號 (SKU)</label>
          <input type="text" name="sku" class="order-manual-sku" value="${escapeHtml(itemData?.sku || "")}" placeholder="SKU">
        </div>
        <div class="form-group qty-group">
          <label>數量</label>
          <input type="number" name="qty" class="order-manual-qty" value="${itemData?.qty || 1}" min="1" required>
        </div>
        <div class="form-group img-group">
          <div class="image-preview-container">
            <div class="preview-box order-manual-img-preview">
              ${itemData?.img ? `<img src="${itemData.img}" alt="Preview">` : `
                <svg class="placeholder-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              `}
            </div>
            <input type="hidden" name="img" class="order-manual-img" value="${escapeHtml(itemData?.img || "")}">
          </div>
        </div>
      </div>
    `;
    
    orderManualItemsContainer.appendChild(itemDiv);
    return itemDiv;
  }

  // 渲染搜尋結果
  function renderSearchResults(filtered) {
    if (!manualSearchResults) return;
    
    if (filtered.length > 0) {
      manualSearchResults.innerHTML = filtered.map(o => {
        let typeLabel = "";
        if (o.type === 'preorder') typeLabel = "預定";
        else if (o.type === 'survey') typeLabel = "調查";
        else if (o.type === 'archive') typeLabel = "回顧";
        
        return `
          <div class="search-result-item" data-title="${escapeHtml(o.title)}">
            <img src="${o.img || '头像/avatar.jpg'}" class="result-img" alt="${escapeHtml(o.title)}">
            <div class="result-info">
              <span class="result-title">${escapeHtml(o.title)} <small style="color:var(--leaf); font-weight:normal;">[${typeLabel}]</small></span>
              <span class="result-sku">${escapeHtml(o.sku || "-")}</span>
            </div>
          </div>
        `;
      }).join("");
      manualSearchResults.hidden = false;
    } else {
      manualSearchResults.innerHTML = '<div class="no-results">查無此商品</div>';
      manualSearchResults.hidden = false;
    }
  }

  // 處理自定義下拉清單搜尋
  manualItemPicker?.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase().trim();
    const options = window.__XIAOJU_SURVEY__.allOptions || [];
    
    if (!val) {
      renderSearchResults(options); // 輸入為空時顯示全部
      return;
    }

    const filtered = options.filter(o => 
      o.title.toLowerCase().includes(val) || (o.sku && o.sku.toLowerCase().includes(val))
    );

    renderSearchResults(filtered);
  });

  // 點擊或聚焦搜尋框時顯示全部 (如果沒輸入)
  manualItemPicker?.addEventListener("focus", (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
      const options = window.__XIAOJU_SURVEY__.allOptions || [];
      renderSearchResults(options);
    }
  });

  // 點擊搜尋結果
  manualSearchResults?.addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (!item) return;

    const title = item.dataset.title;
    const options = window.__XIAOJU_SURVEY__.allOptions || [];
    const match = options.find(o => o.title === title);

    if (match) {
      addManualOrderItem({
        title: match.title,
        sku: match.sku,
        img: match.img,
        qty: 1
      });
      manualItemPicker.value = "";
      manualSearchResults.hidden = true;
    }
  });

  // 點擊外部關閉搜尋結果
  document.addEventListener("click", (e) => {
    if (manualItemPicker && !manualItemPicker.contains(e.target) && manualSearchResults && !manualSearchResults.contains(e.target)) {
      manualSearchResults.hidden = true;
    }
  });

  btnClearManualList?.addEventListener("click", () => {
    if (!confirm("確定要清空目前所有已添加的品種嗎？")) return;
    if (orderManualItemsContainer) {
      orderManualItemsContainer.innerHTML = "";
    }
  });

  // 事件委派處理動態元素的事件
  orderManualItemsContainer?.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-item")) {
      const item = e.target.closest(".order-manual-item");
      if (item) {
        item.remove();
        // 重新編號
        const items = orderManualItemsContainer.querySelectorAll(".order-manual-item");
        items.forEach((el, idx) => {
          el.querySelector("h4").textContent = `品種 ${idx + 1}`;
        });
      }
    }
  });

  orderManualItemsContainer?.addEventListener("input", (e) => {
    const target = e.target;
    const item = target.closest(".order-manual-item");
    if (!item) return;

    if (target.classList.contains("order-manual-title")) {
      const val = target.value;
      const options = window.__XIAOJU_SURVEY__.allOptions || [];
      const match = options.find(p => p.title === val);
      if (match) {
        const skuInput = item.querySelector(".order-manual-sku");
        const imgInput = item.querySelector(".order-manual-img");
        const previewEl = item.querySelector(".order-manual-img-preview");
        
        if (skuInput) skuInput.value = match.sku || "";
        if (imgInput) {
          imgInput.value = match.img || "";
          updateOrderManualPreview(previewEl, match.img);
        }
      }
    } else if (target.classList.contains("order-manual-img")) {
      const previewEl = item.querySelector(".order-manual-img-preview");
      updateOrderManualPreview(previewEl, target.value);
    }
  });

  closeOrderManual?.addEventListener("click", () => {
    orderManualDialog?.close();
    if (orderManualItemsContainer) {
      orderManualItemsContainer.innerHTML = "";
    }
    orderManualForm?.reset();
  });

  orderManualForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(orderManualForm);
    const customerName = fd.get("customerName");
    
    const items = orderManualItemsContainer.querySelectorAll(".order-manual-item");
    const ordersToSave = [];
    
    items.forEach(item => {
      const title = item.querySelector(".order-manual-title").value;
      const sku = item.querySelector(".order-manual-sku").value;
      const qty = parseInt(item.querySelector(".order-manual-qty").value) || 1;
      const img = item.querySelector(".order-manual-img").value || "头像/avatar.jpg";
      
      if (title) {
        ordersToSave.push({
          customerName,
          title,
          sku,
          qty,
          img,
          note: "管理員手動錄入"
        });
      }
    });
    
    if (ordersToSave.length > 0) {
      saveOrdersBatch(customerName, ordersToSave);
    }
    
    orderManualDialog?.close();
    if (orderManualItemsContainer) {
      orderManualItemsContainer.innerHTML = "";
    }
    orderManualForm.reset();
  });

  async function loadOrders() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(o => ({
          ...o,
          id: o.id,
          batchId: o.batch_id,
          time: new Date(o.created_at).toLocaleString("zh-TW"),
          customerName: o.customer_name,
          customerContact: o.customer_contact,
          status: o.status || "待處理"
        }));
      } catch (err) {
        console.error("Fetch Supabase orders failed:", err);
        // 如果雲端抓取失敗，回傳本地數據作為後備
        try {
          const localOrders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
          return localOrders;
        } catch (e) {
          return [];
        }
      }
    }
    try {
      return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  async function saveOrdersBatch(customerName, items, customerContact = null) {
    const now = new Date();
    const timeStr = now.toLocaleString("zh-TW");
    const batchId = "batch-" + Date.now();

    const itemsToSave = items.map(item => ({
      title: item.title || "未命名商品",
      sku: item.sku || null,
      qty: item.qty || 1,
      img: item.img || null,
      note: item.note || null,
      customer_name: customerName || "未知顧客",
      customer_contact: customerContact || item.customer_contact || null,
      batch_id: item.batch_id || batchId,
      status: "待處理",
      created_at: now.toISOString()
    }));

    if (supabase) {
      try {
        const { error } = await supabase.from('orders').insert(itemsToSave);
        if (error) throw error;
        showToast(`成功錄入 ${items.length} 項訂單（已同步至雲端）`);
      } catch (err) {
        console.error("Supabase batch save failed:", err);
        const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
        itemsToSave.forEach(item => orders.unshift({ ...item, time: timeStr, customerName: item.customer_name }));
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        showToast("雲端同步失敗，已改為儲存於本地。請檢查 Supabase 設定（如 RLS 權限）。");
      }
    } else {
      const orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
      itemsToSave.forEach(item => orders.unshift({ ...item, time: timeStr, customerName: item.customer_name }));
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      showToast(`成功錄入 ${items.length} 項訂單（儲存於本地）`);
    }
    await renderOrderList();
  }

  async function updateOrderStatus(id, newStatus) {
    if (supabase) {
      try {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Update status failed:", err);
        showToast("雲端狀態更新失敗，僅更新本地顯示。");
      }
    }
    // 同步更新本地（如果是本地數據）
    let orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    const idx = orders.findIndex(o => o.id === id || String(o.id) === String(id));
    if (idx !== -1) {
      orders[idx].status = newStatus;
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
    await renderOrderList();
    showToast(`訂單狀態已更新為：${newStatus}`);
  }

  async function deleteOrder(id) {
    if (!confirm("確定要刪除此筆記錄嗎？")) return;
    if (supabase) {
      try {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Delete order failed:", err);
        showToast("雲端刪除失敗。");
      }
    }
    // 同步更新本地
    let orders = JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
    const newOrders = orders.filter(o => o.id !== id && String(o.id) !== String(id));
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(newOrders));
    await renderOrderList();
    showToast("記錄已刪除");
  }

  function getStatusClass(status) {
    const map = {
      "待處理": "pending",
      "未處理": "unprocessed",
      "在運輸中": "shipping",
      "已交付": "delivered",
      "已完成": "completed"
    };
    return map[status] || "default";
  }

  async function renderOrderList() {
    const orders = await loadOrders();
    if (ordersTotalEl) ordersTotalEl.textContent = String(orders.length);
    if (!ordersTbody) return;

    if (!orders || orders.length === 0) {
      ordersTbody.innerHTML = `<tr><td colspan="8" class="empty-hint" style="text-align: center; padding: 40px;">目前尚無任何訂單記錄。</td></tr>`;
      return;
    }

    let html = "";
    let lastBatchId = null;

    orders.forEach(o => {
      if (o.batchId !== lastBatchId) {
        html += `
          <tr class="order-batch-header">
            <td colspan="8">
              <div class="batch-info">
                <span class="batch-customer">👤 顧客：${escapeHtml(o.customerName || '未知')}</span>
                ${o.customerContact ? `<span class="batch-customer-contact">📱 聯絡：${escapeHtml(o.customerContact)}</span>` : ''}
                <span class="batch-time">📅 下單時間：${o.time || '-'}</span>
              </div>
            </td>
          </tr>
        `;
        lastBatchId = o.batchId;
      }

      // 確保 ID 作為字串傳遞
      const safeId = `'${o.id}'`;
      const timeDisplay = o.time ? (o.time.includes(' ') ? o.time.split(' ')[1] : o.time) : '-';

      html += `
        <tr class="order-row">
          <td data-label="下單時間"><div class="order-time-mini">${timeDisplay}</div></td>
          <td data-label="顧客姓名">
            <div>${escapeHtml(o.customerName || '未知')}</div>
            ${o.customerContact ? `<div class="order-contact-info">${escapeHtml(o.customerContact)}</div>` : ''}
          </td>
          <td data-label="商品圖片"><img src="${o.img || '头像/avatar.jpg'}" class="order-thumb" alt="${escapeHtml(o.title || '商品')}"></td>
          <td data-label="商品名稱">
            <strong>${escapeHtml(o.title || '未知商品')}</strong>
            ${o.note ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${escapeHtml(o.note)}</div>` : ''}
          </td>
          <td data-label="貨號 (SKU)">${escapeHtml(o.sku || "-")}</td>
          <td data-label="數量">${o.qty || 1}</td>
          <td data-label="狀態">
            <select class="order-status-select status-${getStatusClass(o.status)}" onchange="window.__XIAOJU_SURVEY__.updateOrderStatus(${safeId}, this.value)">
              <option value="待處理" ${o.status === '待處理' ? 'selected' : ''}>待處理</option>
              <option value="未處理" ${o.status === '未處理' ? 'selected' : ''}>未處理</option>
              <option value="在運輸中" ${o.status === '在運輸中' ? 'selected' : ''}>在運輸中</option>
              <option value="已交付" ${o.status === '已交付' ? 'selected' : ''}>已交付</option>
              <option value="已完成" ${o.status === '已完成' ? 'selected' : ''}>已完成</option>
            </select>
          </td>
          <td data-label="操作">
            <button type="button" class="btn-order-del" onclick="window.__XIAOJU_SURVEY__.deleteOrder(${safeId})" title="刪除記錄">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `;
    });

    ordersTbody.innerHTML = html;
  }

  async function exportOrdersToExcel() {
    const orders = await loadOrders();
    if (orders.length === 0) {
      showToast("沒有訂單記錄可導出");
      return;
    }

    const data = orders.map(o => ({
      "下單時間": o.time,
      "顧客姓名": o.customerName,
      "聯絡方式": o.customerContact || "-",
      "商品名稱": o.title,
      "備註/價格": o.note || "-",
      "貨號 (SKU)": o.sku || "-",
      "數量": o.qty || 1,
      "訂單狀態": o.status
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "訂單追蹤列表");
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(wb, `小居園藝屋_訂單追蹤表_${dateStr}.xlsx`);
    showToast("Excel 報表導出中...");
  }

  document.getElementById("export-orders-xlsx")?.addEventListener("click", exportOrdersToExcel);
  document.getElementById("clear-orders-btn")?.addEventListener("click", clearOrders);

  function simulateOrder(id, type = "survey") {
    let item;
    if (type === "survey") item = products.find(x => x.id === id);
    else if (type === "preorder") item = PREORDER_ENTRIES.find(x => x.id === id);
    else item = ARCHIVE_ENTRIES.find(x => x.id === id);

    if (!item) return;

    // 將商品加入手動錄入列表
    addManualOrderItem({
      title: item.title,
      sku: item.sku || (type === 'preorder' ? 'PRE-ORDER' : (type === 'archive' ? 'ARCHIVE' : '')),
      img: item.img,
      qty: 1
    });

    // 打開彈窗（如果還沒打開）
    if (!orderManualDialog.open) {
      populatePreorderDatalist();
      orderManualDialog.showModal();
    }
    
    showToast(`已將 ${item.title} 加入錄入清單`);
  }

  adminLoginTrigger?.addEventListener("click", () => adminLoginDialog?.showModal());
  closeAdminLogin?.addEventListener("click", () => adminLoginDialog?.close());
  
  adminLoginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(adminLoginForm);
    if (fd.get("username") === ADMIN_CREDENTIALS.user && fd.get("password") === ADMIN_CREDENTIALS.pass) {
      isAdmin = true;
      adminLoginDialog.close();
      adminLoginForm.reset();
      updateAdminUI();
      showToast("管理員登入成功！已進入編輯模式");
    } else {
      showToast("帳號或密碼錯誤");
    }
  });

  adminLogoutTrigger?.addEventListener("click", () => {
    isAdmin = false;
    updateAdminUI();
    showToast("已登出管理員模式");
  });

  const productTypeSelect = document.getElementById("product-type-select");
  const productItemsContainer = document.getElementById("product-items-container");
  const btnAddProductItem = document.getElementById("btn-add-product-item");

  function updateProductPreview(previewEl, src) {
    if (!previewEl) return;
    if (src) {
      previewEl.innerHTML = `<img src="${src}" alt="Preview">`;
    } else {
      previewEl.innerHTML = `<svg class="placeholder-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    }
  }

  // 事件委派處理動態商品項目的事件
  productItemsContainer?.addEventListener("input", (e) => {
    const target = e.target;
    const item = target.closest(".product-item-row");
    if (!item) return;

    if (target.classList.contains("product-img-path")) {
      const previewEl = item.querySelector(".product-img-preview");
      updateProductPreview(previewEl, target.value);
    }
  });

  productItemsContainer?.addEventListener("change", (e) => {
    const target = e.target;
    const item = target.closest(".product-item-row");
    if (!item) return;

    if (target.classList.contains("product-img-file-input")) {
      if (target.files && target.files[0]) {
        const reader = new FileReader();
        const previewEl = item.querySelector(".product-img-preview");
        reader.onload = (ev) => updateProductPreview(previewEl, ev.target.result);
        reader.readAsDataURL(target.files[0]);
      }
    }
  });

  productItemsContainer?.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-product-item")) {
      const item = e.target.closest(".product-item-row");
      if (item) {
        item.remove();
        // 重新編號
        const items = productItemsContainer.querySelectorAll(".product-item-row");
        items.forEach((el, idx) => {
          el.querySelector(".product-item-index").textContent = `商品 ${idx + 1}`;
        });
      }
    }
  });

  btnAddProductItem?.addEventListener("click", () => {
    if (!productItemsContainer) return;
    const items = productItemsContainer.querySelectorAll(".product-item-row");
    const newIndex = items.length + 1;
    
    const firstItem = items[0];
    const newItem = firstItem.cloneNode(true);
    
    // 更新標題和按鈕
    newItem.querySelector(".product-item-index").textContent = `商品 ${newIndex}`;
    newItem.querySelector(".btn-remove-product-item").style.display = "block";
    
    // 清空輸入值
    newItem.querySelectorAll("input").forEach(input => {
      if (input.type !== "file") input.value = "";
    });
    newItem.querySelectorAll("select").forEach(select => select.selectedIndex = 0);
    
    // 重置預覽圖
    const previewEl = newItem.querySelector(".product-img-preview");
    if (previewEl) {
      updateProductPreview(previewEl, "");
    }
    
    productItemsContainer.appendChild(newItem);
  });

  productTypeSelect?.addEventListener("change", (e) => {
    const type = e.target.value;
    const items = productItemsContainer.querySelectorAll(".product-item-row");
    items.forEach(item => {
      const catField = item.querySelector(".cat-field");
      const priceField = item.querySelector(".price-field");
      if (catField) catField.hidden = type !== "survey";
      if (priceField) priceField.hidden = type !== "preorder";
    });
  });

  // 商品新增/修改
  addProductBtn?.addEventListener("click", () => {
    productDialogTitle.textContent = "新增商品";
    productEditForm.reset();
    productEditForm.id.value = "";
    
    // 重置為單個項目
    if (productItemsContainer) {
      const items = productItemsContainer.querySelectorAll(".product-item-row");
      for (let i = 1; i < items.length; i++) {
        items[i].remove();
      }
      const firstPreview = items[0]?.querySelector(".product-img-preview");
      if (firstPreview) updateProductPreview(firstPreview, "");
      items[0].querySelector(".btn-remove-product-item").style.display = "none";
    }
    
    btnAddProductItem.style.display = "block";

    // 根據當前分頁預設選擇類型
    if (viewMode === "preorder") {
      productTypeSelect.value = "preorder";
    } else if (viewMode === "archive") {
      productTypeSelect.value = "archive";
    } else {
      productTypeSelect.value = "survey";
    }
    productTypeSelect.dispatchEvent(new Event("change"));
    productEditDialog.showModal();
  });

  closeProductEdit?.addEventListener("click", () => {
    productEditDialog.close();
  });

  productEditForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(productEditForm);
    const editId = fd.get("id");
    const type = fd.get("type");
    
    const items = productItemsContainer.querySelectorAll(".product-item-row");
    const productsToSave = [];
    
    for (const item of items) {
      const title = item.querySelector('input[name="title"]').value;
      const cat = item.querySelector('select[name="cat"]').value;
      const price = parseFloat(item.querySelector('input[name="price"]').value) || 0;
      const sku = item.querySelector('input[name="sku"]').value;
      const spec = item.querySelector('input[name="spec"]').value;
      const imgPathInput = item.querySelector('.product-img-path').value;
      const fileInput = item.querySelector('.product-img-file-input');
      
      let imgData = imgPathInput || "头像/avatar.jpg";
      if (fileInput.files && fileInput.files[0]) {
        imgData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(fileInput.files[0]);
        });
      }
      
      if (title) {
        const productData = {
          title,
          sku,
          specDetail: spec,
          img: imgData,
          sortOrder: 0
        };

        if (type === "survey") {
          productData.category = cat;
          productData.categoryLabel = CATEGORY_LABELS[cat];
        } else if (type === "preorder") {
          productData.price = price;
          productData.note = spec;
        } else {
          productData.note = spec;
        }
        
        productsToSave.push(productData);
      }
    }

    if (productsToSave.length === 0) return;

    let storageKey = ADMIN_STORAGE_KEY;
    if (type === "preorder") storageKey = ADMIN_PREORDER_KEY;
    if (type === "archive") storageKey = ADMIN_ARCHIVE_KEY;

    const adminProds = JSON.parse(localStorage.getItem(storageKey) || "[]");
    
    if (editId) {
      // 編輯模式（僅限單個）
      const idx = adminProds.findIndex(p => p.id === editId);
      if (idx !== -1) {
        Object.assign(adminProds[idx], productsToSave[0]);
      }
    } else {
      // 新增模式（支援批量）
      productsToSave.forEach(p => {
        adminProds.unshift({
          id: `${type}-admin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          isDefault: false,
          ...p
        });
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(adminProds));
    
    // 重新加載對應數據
    if (type === "survey") {
      products = getCombinedProducts();
      renderGrid();
      if (productTotalEl) productTotalEl.textContent = String(products.length);
    } else if (type === "preorder") {
      PREORDER_ENTRIES = getCombinedPreorder();
      renderPreorderGrid();
      if (preorderTotalEl) preorderTotalEl.textContent = String(PREORDER_ENTRIES.length);
    } else {
      ARCHIVE_ENTRIES = getCombinedArchive();
      renderArchiveGrid();
      if (archiveTotalEl) archiveTotalEl.textContent = String(ARCHIVE_ENTRIES.length);
    }

    productEditDialog.close();
    showToast(editId ? "商品修改成功" : `成功新增 ${productsToSave.length} 個商品`);
  });

  const billboardEl = document.getElementById("billboard");
  const BILLBOARD_DISMISS_KEY = "xiaoju-billboard-dismissed";

  async function renderBillboard() {
    if (!billboardEl) return;
    
    // 如果在管理員模式下，且還沒從 Supabase 加載過，則加載一次
    await loadAnnouncement();

    // 如果關閉標誌為 true，或是在當前 session 已關閉過，則隱藏
    const isDismissed = sessionStorage.getItem(BILLBOARD_DISMISS_KEY);
    if (!ANNOUNCEMENT.show || isDismissed) {
      billboardEl.hidden = true;
      return;
    }

    billboardEl.innerHTML = `
      <button type="button" class="billboard-close" id="billboard-close" aria-label="關閉公告">×</button>
      ${isAdmin ? `<button type="button" class="billboard-edit-btn" id="billboard-edit-trigger">編輯公告</button>` : ''}
      <div class="billboard-img">
        <img src="${ANNOUNCEMENT.img}" alt="Billboard Image">
      </div>
      <div class="billboard-content">
        <div class="billboard-badge">${escapeHtml(ANNOUNCEMENT.badge)}</div>
        <h2 class="billboard-title">${escapeHtml(ANNOUNCEMENT.title)}</h2>
        <p class="billboard-text">${escapeHtml(ANNOUNCEMENT.text)}</p>
        <a href="${ANNOUNCEMENT.btnLink}" class="billboard-btn">${escapeHtml(ANNOUNCEMENT.btnText)}</a>
      </div>
    `;

    document.getElementById("billboard-close")?.addEventListener("click", () => {
      billboardEl.hidden = true;
      sessionStorage.setItem(BILLBOARD_DISMISS_KEY, "true");
    });

    document.getElementById("billboard-edit-trigger")?.addEventListener("click", showBillboardEditor);

    billboardEl.hidden = false;
  }

  function showBillboardEditor() {
    if (!billboardEl) return;
    billboardEl.innerHTML = `
      <form class="billboard-edit-form" id="billboard-edit-form">
        <h3>編輯公告板內容</h3>
        <label>小標籤 (Badge): <input type="text" name="badge" value="${escapeHtml(ANNOUNCEMENT.badge)}"></label>
        <label>大標題 (Title): <input type="text" name="title" value="${escapeHtml(ANNOUNCEMENT.title)}"></label>
        <label>內容描述 (Text): <textarea name="text" rows="3">${escapeHtml(ANNOUNCEMENT.text)}</textarea></label>
        
        <div class="billboard-upload-section">
          <label>上傳圖片 (Upload Image): 
            <input type="file" id="billboard-img-upload" accept="image/*">
          </label>
          <div class="billboard-img-preview-wrap">
            <span class="billboard-current-img-hint" id="billboard-current-img-hint">目前圖片: ${ANNOUNCEMENT.img.startsWith('data:') ? '已上傳自定義圖片' : ANNOUNCEMENT.img}</span>
            <button type="button" class="btn-delete-img" id="billboard-delete-img">刪除圖片</button>
          </div>
        </div>

        <label>或使用圖片路徑: <input type="text" name="img" id="billboard-img-path" value="${escapeHtml(ANNOUNCEMENT.img)}"></label>
        <label>按鈕文字 (Button Text): <input type="text" name="btnText" value="${escapeHtml(ANNOUNCEMENT.btnText)}"></label>
        <label>按鈕連結 (Button Link): <input type="text" name="btnLink" value="${escapeHtml(ANNOUNCEMENT.btnLink)}"></label>
        <div class="billboard-edit-actions">
          <button type="button" class="btn-secondary" id="billboard-edit-cancel">取消</button>
          <button type="submit" class="btn-primary">保存修改</button>
        </div>
      </form>
    `;

    const form = document.getElementById("billboard-edit-form");
    const fileInput = document.getElementById("billboard-img-upload");
    const pathInput = document.getElementById("billboard-img-path");
    const deleteImgBtn = document.getElementById("billboard-delete-img");
    const currentImgHint = document.getElementById("billboard-current-img-hint");

    // 刪除圖片邏輯
    deleteImgBtn?.addEventListener("click", () => {
      if (fileInput) fileInput.value = "";
      if (pathInput) pathInput.value = "头像/bg-search.png"; // 恢復預設圖
      if (currentImgHint) currentImgHint.textContent = "目前圖片: 已重置為預設";
      showToast("已重置圖片，請記得保存修改");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      
      let finalImg = fd.get("img");

      // 如果有選擇檔案，則讀取為 Data URL
      if (fileInput && fileInput.files && fileInput.files[0]) {
        try {
          finalImg = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(fileInput.files[0]);
          });
        } catch (err) {
          console.error("Image upload failed:", err);
          showToast("圖片上傳失敗，請重試");
          return;
        }
      }

      ANNOUNCEMENT = {
        show: true,
        badge: fd.get("badge"),
        title: fd.get("title"),
        text: fd.get("text"),
        img: finalImg,
        btnText: fd.get("btnText"),
        btnLink: fd.get("btnLink")
      };

      try {
        // 同步到 Supabase
        if (supabase) {
          const { error } = await supabase
            .from('billboard')
            .upsert({
              id: 1,
              show: true,
              badge: ANNOUNCEMENT.badge,
              title: ANNOUNCEMENT.title,
              text: ANNOUNCEMENT.text,
              img: ANNOUNCEMENT.img,
              btn_text: ANNOUNCEMENT.btnText,
              btn_link: ANNOUNCEMENT.btnLink,
              updated_at: new Date().toISOString()
            });
          
          if (error) throw error;
          showToast("公告內容已同步至雲端，所有使用者均可看到更新");
        } else {
          // 僅本地保存作為後備
          localStorage.setItem(BILLBOARD_STORAGE_KEY, JSON.stringify(ANNOUNCEMENT));
          showToast("Supabase 未連接，僅在本地保存");
        }
        
        await renderBillboard();
      } catch (e) {
        console.error("Save announcement failed:", e);
        if (e.name === 'QuotaExceededError') {
          showToast("圖片太大（超過 5MB），無法保存，請嘗試使用較小的圖片或壓縮後上傳。");
        } else {
          showToast(`保存失敗: ${e.message || "未知錯誤"}`);
        }
      }
    });

    document.getElementById("billboard-edit-cancel")?.addEventListener("click", renderBillboard);
  }
  const filterHeading = document.getElementById("filter-heading");
  const filterPreorderNote = document.getElementById("filter-preorder-note");
  const summaryBtn = document.getElementById("summary-btn");
  const summaryDialog = document.getElementById("summary-dialog");
  const summaryBody = document.getElementById("summary-body");
  const userNameInput = document.getElementById("user-name");
  const copySummaryBtn = document.getElementById("copy-summary");
  const downloadExcelBtn = document.getElementById("download-excel");
  const clearAllBtn = document.getElementById("clear-all-wtp");
  const closeSummaryBtn = document.getElementById("close-summary");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add("show");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    // 點擊頭像
    if (e.target.closest(".brand-mark img")) {
      openLightbox(e.target.src);
      return;
    }
    // 點擊產品圖
    if (e.target.closest(".product-card .thumb img")) {
      openLightbox(e.target.src);
      return;
    }
    // 點擊 Lightbox 背景關閉
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

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
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.file && p.file.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.categoryLabel && p.categoryLabel.includes(q))
      );
    });

    if (sortMode === "filled-first") {
      list = [...list].sort((a, b) => {
        const fa = hasWtp(a.id) ? 1 : 0;
        const fb = hasWtp(b.id) ? 1 : 0;
        if (fb !== fa) return fb - fa;
        return String(a.id).localeCompare(String(b.id));
      });
    } else {
      list = [...list].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }

    return list;
  }

  function bindWtpForms() {
    gridEl.querySelectorAll(".wtp-form").forEach((form) => {
      const id = form.getAttribute("data-pid");
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
        const p = products.find((x) => String(x.id) === String(id));
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
        (p) => {
          const imgSrc = p.img || `照片回顾/${encodeURIComponent(p.file)}`;
          
          return `
      <article class="product-card" data-id="${p.id}">
        <div class="thumb">
          <img src="${imgSrc}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="400" />
        </div>
        <div class="info">
          <h3 class="title">${escapeHtml(p.title)}</h3>
          <dl class="product-spec">
            <div class="row"><dt>货号</dt><dd>${escapeHtml(p.sku)}</dd></div>
            <div class="row"><dt>类目</dt><dd>${escapeHtml(p.categoryLabel)}</dd></div>
            <div class="row"><dt>规格</dt><dd>${escapeHtml(p.specDetail)}</dd></div>
          </dl>
          
          ${isAdmin ? `
          <div class="product-admin-tools">
            <button type="button" class="btn-admin-edit" onclick="window.__XIAOJU_SURVEY__.editProduct('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              修改
            </button>
            <button type="button" class="btn-admin-del" onclick="window.__XIAOJU_SURVEY__.delProduct('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              刪除
            </button>
            <button type="button" class="btn-admin-top" onclick="window.__XIAOJU_SURVEY__.topProduct('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
              置頂
            </button>
            <button type="button" class="btn-simulate-order" onclick="window.__XIAOJU_SURVEY__.simulateOrder('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              模擬下單
            </button>
          </div>
          ` : `
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
          `}
        </div>
      </article>
    `;
        }
      )
      .join("");

    bindWtpForms();
  }

  /** 預定照片路徑可含子資料夾，需分段 encode，不可整段 encodeURIComponent（會破壞 /）。 */
  function preorderPhotoSrc(file) {
    return file.split("/").map(encodeURIComponent).join("/");
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
        (p) => {
          const imgSrc = p.img || `预定照片/${preorderPhotoSrc(p.file)}`;
          return `
      <article class="product-card product-card--preorder" data-preid="${escapeHtml(p.id)}">
        <div class="thumb">
          <img src="${imgSrc}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="400" />
        </div>
        <div class="info">
          <h3 class="title">${escapeHtml(p.title)}</h3>
          <div class="preorder-price-block">
            <span class="preorder-price">RM ${Number(p.price).toFixed(2)}</span>
            <span class="preorder-price-tag">固定價</span>
          </div>
          <p class="preorder-note">${escapeHtml(p.note)}</p>
          
          ${isAdmin ? `
          <div class="product-admin-tools">
            <button type="button" class="btn-admin-edit" onclick="window.__XIAOJU_SURVEY__.editProduct('${p.id}', 'preorder')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              修改
            </button>
            <button type="button" class="btn-admin-del" onclick="window.__XIAOJU_SURVEY__.delProduct('${p.id}', 'preorder')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              刪除
            </button>
            <button type="button" class="btn-admin-top" onclick="window.__XIAOJU_SURVEY__.topProduct('${p.id}', 'preorder')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
              置頂
            </button>
            <button type="button" class="btn-simulate-order" onclick="window.__XIAOJU_SURVEY__.simulateOrder('${p.id}', 'preorder')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              模擬下單
            </button>
          </div>
          ` : `
          <form class="preorder-form" data-preid="${escapeHtml(p.id)}" novalidate>
            <div class="preorder-row">
              <label class="preorder-label" for="pre-qty-${escapeHtml(p.id)}">預定數量</label>
              <input
                class="preorder-input"
                id="pre-qty-${escapeHtml(p.id)}"
                name="qty"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                autocomplete="off"
              />
              <button type="submit" class="preorder-submit">儲存預定</button>
            </div>
            <p class="preorder-hint">填寫數量後送出儲存；設為 0 可移除該項。</p>
          </form>
          `}
        </div>
      </article>
    `;
        }
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

  function filteredArchiveList() {
    const q = (searchInput.value || "").trim().toLowerCase();
    return ARCHIVE_ENTRIES.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.file.toLowerCase().includes(q) ||
        p.note.toLowerCase().includes(q)
      );
    });
  }

  function renderArchiveGrid() {
    const list = filteredArchiveList();
    if (!archiveGridEl) return;
    if (!list.length) {
      archiveGridEl.innerHTML =
        '<div class="empty-hint">沒有符合的以往品項，請換個關鍵字試試。</div>';
      return;
    }

    archiveGridEl.innerHTML = list
      .map(
        (p) => {
          const isWanted = getArchiveWant(p.id);
          const imgSrc = p.img || preorderPhotoSrc(p.file);
          return `
      <article class="product-card product-card--archive ${isWanted ? 'is-wanted' : ''}" data-arcid="${escapeHtml(p.id)}">
        <div class="thumb">
          <img src="${imgSrc}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="400" />
        </div>
        <div class="info">
          <h3 class="title">${escapeHtml(p.title)}</h3>
          <p class="preorder-note">${escapeHtml(p.note)}</p>
          
          ${isAdmin ? `
          <div class="product-admin-tools">
            <button type="button" class="btn-admin-edit" onclick="window.__XIAOJU_SURVEY__.editProduct('${p.id}', 'archive')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              修改
            </button>
            <button type="button" class="btn-admin-del" onclick="window.__XIAOJU_SURVEY__.delProduct('${p.id}', 'archive')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              刪除
            </button>
            <button type="button" class="btn-admin-top" onclick="window.__XIAOJU_SURVEY__.topProduct('${p.id}', 'archive')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
              置頂
            </button>
            <button type="button" class="btn-simulate-order" onclick="window.__XIAOJU_SURVEY__.simulateOrder('${p.id}', 'archive')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              模擬下單
            </button>
          </div>
          ` : `
          <div class="archive-actions">
            <button type="button" class="archive-want-btn ${isWanted ? 'active' : ''}" data-arcid="${escapeHtml(p.id)}">
              ${isWanted ? '★ 已加入想要' : '☆ 想要'}
            </button>
          </div>
          `}
        </div>
      </article>
    `;
        }
      )
      .join("");

    archiveGridEl.querySelectorAll(".archive-want-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const arcId = btn.getAttribute("data-arcid");
        const currentWant = getArchiveWant(arcId);
        const newWant = !currentWant;
        saveArchiveWant(arcId, newWant);
        updateRecordCount();
        const item = ARCHIVE_ENTRIES.find((x) => x.id === arcId);
        if (newWant) {
          showToast(`已將「${item.title}」加入想要清單`);
        } else {
          showToast(`已從想要清單移除「${item.title}」`);
        }
        renderArchiveGrid();
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
    if (archiveSection) archiveSection.hidden = mode !== "archive";
    if (ordersSection) ordersSection.hidden = mode !== "orders";
    
    if (filterHeading) filterHeading.hidden = mode !== "survey";
    if (filterWrap) filterWrap.hidden = mode !== "survey";
    if (filterPreorderNote) filterPreorderNote.hidden = mode !== "preorder" && mode !== "archive";
    
    if (mode === "preorder") {
      renderPreorderGrid();
    } else if (mode === "archive") {
      renderArchiveGrid();
    } else if (mode === "orders") {
      renderOrderList();
    } else {
      renderGrid();
    }
  }

  window.__XIAOJU_SURVEY__ = window.__XIAOJU_SURVEY__ || {};
  window.supabaseClient = supabase;

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fillSummaryBody() {
    const all = loadAllWtp();
    const pre = loadPreorder();
    const arc = loadArchive();
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

    const arcRows = ARCHIVE_ENTRIES.filter((p) => arc[p.id] && arc[p.id].want).map(
      (p) => {
        return `<tr><td>${escapeHtml(p.title)}</td><td>想要</td></tr>`;
      }
    );
    if (arcRows.length) {
      parts.push(
        '<h3 class="summary-section-h">商品回顧（想要清單）</h3>' +
          '<table class="summary-table"><thead><tr><th>品名</th><th>狀態</th></tr></thead><tbody>' +
          arcRows.join("") +
          "</tbody></table>"
      );
    }

    if (!parts.length) {
      summaryBody.innerHTML = "<p class=\"summary-empty\">尚未記錄任何意願、預定或想要。</p>";
      return;
    }
    summaryBody.innerHTML = parts.join("");
  }

  function buildSummaryText() {
    const all = loadAllWtp();
    const pre = loadPreorder();
    const arc = loadArchive();
    const name = (userNameInput?.value || "").trim();
    const lines = ["Xiaoju Gardening House · 已記錄清單", ""];

    if (name) {
      lines.push(`客戶姓名：${name}`);
      lines.push("");
    }

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

    lines.push("");
    lines.push("【商品回顧（想要清單）】");
    lines.push("品名\t狀態");
    ARCHIVE_ENTRIES.forEach((p) => {
      const e = arc[p.id];
      if (e && e.want) {
        lines.push(`${p.title.replace(/\t/g, " ")}\t想要`);
      }
    });

    return lines.join("\n");
  }

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
      if (mode === "survey" || mode === "preorder" || mode === "archive" || mode === "orders") switchMode(mode);
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
    else if (viewMode === "archive") renderArchiveGrid();
    else renderGrid();
  });
  document.getElementById("search-btn").addEventListener("click", () => {
    if (viewMode === "preorder") renderPreorderGrid();
    else if (viewMode === "archive") renderArchiveGrid();
    else renderGrid();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (viewMode === "preorder") renderPreorderGrid();
      else if (viewMode === "archive") renderArchiveGrid();
      else renderGrid();
    }
  });

  const btnOpenCheckout = document.getElementById("btn-open-checkout");
  const customerCheckoutDialog = document.getElementById("customer-checkout-dialog");
  const customerCheckoutForm = document.getElementById("customer-checkout-form");
  const closeCustomerCheckout = document.getElementById("close-customer-checkout");

  btnOpenCheckout?.addEventListener("click", () => {
    // 檢查是否有選中任何商品
    const all = loadAllWtp();
    const pre = loadPreorder();
    const arc = loadArchive();
    
    const hasItems = products.some(p => all[p.id] && String(all[p.id].wtp).trim() !== "") ||
                    PREORDER_ENTRIES.some(p => pre[p.id] && parseInt(pre[p.id].qty) > 0) ||
                    ARCHIVE_ENTRIES.some(p => arc[p.id] && arc[p.id].want);

    if (!hasItems) {
      showToast("您的清單目前是空的，請先挑選商品後再提交。");
      return;
    }

    // 預填姓名（如果有的話）
    const checkoutNameInput = document.getElementById("checkout-customer-name");
    if (checkoutNameInput && userNameInput) {
      checkoutNameInput.value = userNameInput.value;
    }

    customerCheckoutDialog?.showModal();
  });

  closeCustomerCheckout?.addEventListener("click", () => {
    customerCheckoutDialog?.close();
  });

  customerCheckoutForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(customerCheckoutForm);
    const customerName = fd.get("customerName");
    const customerContact = fd.get("customerContact");
    
    const all = loadAllWtp();
    const pre = loadPreorder();
    const arc = loadArchive();
    const now = new Date();
    const timeStr = now.toLocaleString("zh-TW");
    const batchId = "cust-" + Date.now();
    
    const itemsToSubmit = [];

    // 意願調查
    products.forEach(p => {
      const e = all[p.id];
      if (e && String(e.wtp).trim() !== "") {
        itemsToSubmit.push({
          title: p.title,
          sku: p.sku,
          qty: 1,
          img: p.img,
          note: `意願價: RM ${e.wtp}`
        });
      }
    });

    // 預定產品
    PREORDER_ENTRIES.forEach(p => {
      const e = pre[p.id];
      if (e && parseInt(e.qty) > 0) {
        itemsToSubmit.push({
          title: p.title,
          sku: p.sku || "PRE-ORDER",
          qty: parseInt(e.qty),
          img: p.img,
          note: `預定單價: RM ${p.price}`
        });
      }
    });

    // 商品回顧
    ARCHIVE_ENTRIES.forEach(p => {
      const e = arc[p.id];
      if (e && e.want) {
        itemsToSubmit.push({
          title: p.title,
          sku: p.sku || "ARCHIVE",
          qty: 1,
          img: p.img,
          note: "想要清單"
        });
      }
    });

    if (itemsToSubmit.length === 0) return;

    await saveOrdersBatch(customerName, itemsToSubmit, customerContact);
    
    customerCheckoutDialog?.close();
    summaryDialog?.close();
    
    // 清空本地清單
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREORDER_STORAGE_KEY);
    localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    
    updateWtpCount();
    renderGrid();
    renderPreorderGrid();
    renderArchiveGrid();
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
    const name = (userNameInput?.value || "").trim();
    if (!name) {
      showToast("請先輸入您的姓名/暱稱，才能複製清單。");
      userNameInput?.focus();
      return;
    }
    const text = buildSummaryText();
    try {
      await navigator.clipboard.writeText(text);
      showToast("已複製清單到剪貼簿");
    } catch {
      showToast("複製失敗，請手動選取表格內容");
    }
  });

  function downloadCSV(csvContent, fileName) {
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadExcelBtn.addEventListener("click", () => {
       const name = (userNameInput?.value || "").trim();
       if (!name) {
         showToast("請先輸入您的姓名/暱稱，才能下載 Excel。");
         userNameInput?.focus();
         return;
       }
       const all = loadAllWtp();
       const pre = loadPreorder();
       const arc = loadArchive();
       let csv = "";
 
       csv += `客戶姓名：,${name.replace(/,/g, " ")}\n\n`;
       csv += "類別,貨號/品名,單價(RM),數量/願付價,小計(RM)\n";
 
       // 意願調查
       products.forEach((p) => {
         const e = all[String(p.id)];
         if (e && String(e.wtp).trim() !== "") {
           csv += `購買意願,${p.sku} ${p.title.replace(/,/g, " ")},-,RM ${e.wtp},-\n`;
         }
       });
 
       // 預定產品
       PREORDER_ENTRIES.forEach((p) => {
         const e = pre[p.id];
         if (e && parseInt(String(e.qty), 10) > 0) {
           const q = parseInt(String(e.qty), 10);
           const sub = p.price * q;
           csv += `預定產品,${p.title.replace(/,/g, " ")},${p.price},${q},${sub.toFixed(2)}\n`;
         }
       });

       // 商品回顧
       ARCHIVE_ENTRIES.forEach((p) => {
         const e = arc[p.id];
         if (e && e.want) {
           csv += `商品回顧,${p.title.replace(/,/g, " ")},- ,想要,-\n`;
         }
       });
 
       if (csv.split("\n").filter(l => l.trim()).length <= 3) {
         showToast("目前沒有可下載的記錄");
         return;
       }
 
       const now = new Date();
       const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
       const fileName = name ? `小居園藝屋_預定清單_${name}_${dateStr}.csv` : `小居園藝屋_預定清單_${dateStr}.csv`;
       downloadCSV(csv, fileName);
       showToast("Excel (CSV) 下載中...");
    });

  clearAllBtn.addEventListener("click", () => {
    if (!countSurveyFilled() && !countPreorderFilled() && !countArchiveFilled()) {
      showToast("目前沒有已記錄的意願、預定或想要");
      return;
    }
    if (!confirm("確定要清除本機儲存的全部「購買意願」、「預定產品」與「想要清單」嗎？此動作無法復原。")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREORDER_STORAGE_KEY);
    localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    if (userNameInput) userNameInput.value = "";
    updateWtpCount();
    fillSummaryBody();
    renderGrid();
    renderPreorderGrid();
    renderArchiveGrid();
    showToast("已清除全部記錄");
  });

  async function init() {
    updateAdminUI(); // 加入管理員 UI 更新
    try {
      await renderBillboard();
    } catch (e) {
      console.error("Billboard render failed", e);
    }

    try {
      updateWtpCount();
    } catch (e) {
      console.error("Count update failed", e);
    }

    if (productTotalEl) productTotalEl.textContent = String(products.length);
    if (preorderTotalEl) preorderTotalEl.textContent = String(PREORDER_ENTRIES.length);
    if (archiveTotalEl) archiveTotalEl.textContent = String(ARCHIVE_ENTRIES.length);

    // 渲染分類按鈕
    if (filterWrap) {
      filterWrap.innerHTML = "";
      CATEGORIES.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "filter-btn" + (c.id === activeCategory ? " active" : "");
        b.textContent = c.label;
        b.dataset.cat = c.id;
        filterWrap.appendChild(b);
      });
    }
  }

  init();

  if (userNameInput) {
    userNameInput.value = localStorage.getItem(USER_NAME_KEY) || "";
    userNameInput.addEventListener("input", () => {
      localStorage.setItem(USER_NAME_KEY, userNameInput.value);
    });
  }

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
    
    // 管理員導出函式
    editProduct: (id, type = "survey") => {
      let item;
      if (type === "survey") item = products.find(x => x.id === id);
      else if (type === "preorder") item = PREORDER_ENTRIES.find(x => x.id === id);
      else item = ARCHIVE_ENTRIES.find(x => x.id === id);

      if (!item) return;
      productDialogTitle.textContent = "修改商品";
      productEditForm.id.value = item.id;
      productTypeSelect.value = type;
      
      // 重置並填充單個項目
      if (productItemsContainer) {
        const items = productItemsContainer.querySelectorAll(".product-item-row");
        for (let i = 1; i < items.length; i++) {
          items[i].remove();
        }
        const first = items[0];
        first.querySelector('input[name="title"]').value = item.title;
        if (type === "survey") first.querySelector('select[name="cat"]').value = item.category || "tuotu";
        if (type === "preorder") first.querySelector('input[name="price"]').value = item.price || 0;
        first.querySelector('input[name="spec"]').value = item.specDetail || item.note || "";
        first.querySelector('input[name="sku"]').value = item.sku || "";
        
        const imgSrc = item.img || "";
        first.querySelector(".product-img-path").value = imgSrc;
        const previewEl = first.querySelector(".product-img-preview");
        updateProductPreview(previewEl, imgSrc);
        
        first.querySelector(".btn-remove-product-item").style.display = "none";
      }
      
      btnAddProductItem.style.display = "none"; // 修改模式隱藏批量按鈕
      productTypeSelect.dispatchEvent(new Event("change"));
      productEditDialog.showModal();
    },
    delProduct: (id, type = "survey") => {
      if (!confirm("確定要刪除此商品嗎？")) return;
      let storageKey = ADMIN_STORAGE_KEY;
      if (type === "preorder") storageKey = ADMIN_PREORDER_KEY;
      if (type === "archive") storageKey = ADMIN_ARCHIVE_KEY;

      let adminProds = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const isDefault = id.startsWith('p-') || id.startsWith('pre-') || id.startsWith('arc-');
      
      if (isDefault) {
        showToast("預設商品目前僅支援修改，不支援刪除。");
        return;
      }
      adminProds = adminProds.filter(p => p.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(adminProds));
      
      if (type === "survey") { products = getCombinedProducts(); renderGrid(); }
      else if (type === "preorder") { PREORDER_ENTRIES = getCombinedPreorder(); renderPreorderGrid(); }
      else { ARCHIVE_ENTRIES = getCombinedArchive(); renderArchiveGrid(); }
      
      showToast("商品已刪除");
    },
    topProduct: (id, type = "survey") => {
      let storageKey = ADMIN_STORAGE_KEY;
      let currentList;
      if (type === "survey") { storageKey = ADMIN_STORAGE_KEY; currentList = products; }
      else if (type === "preorder") { storageKey = ADMIN_PREORDER_KEY; currentList = PREORDER_ENTRIES; }
      else { storageKey = ADMIN_ARCHIVE_KEY; currentList = ARCHIVE_ENTRIES; }

      let adminProds = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const isDefault = id.startsWith('p-') || id.startsWith('pre-') || id.startsWith('arc-');
      const maxOrder = Math.max(0, ...currentList.map(p => p.sortOrder || 0));
      
      if (isDefault) {
        const original = currentList.find(p => p.id === id);
        adminProds.push({
          ...original,
          id: `${type}-top-${Date.now()}`,
          isDefault: false,
          sortOrder: maxOrder + 1
        });
      } else {
        const idx = adminProds.findIndex(p => p.id === id);
        if (idx !== -1) {
          adminProds[idx].sortOrder = maxOrder + 1;
        }
      }
      
      localStorage.setItem(storageKey, JSON.stringify(adminProds));
      
      if (type === "survey") { products = getCombinedProducts(); renderGrid(); }
      else if (type === "preorder") { PREORDER_ENTRIES = getCombinedPreorder(); renderPreorderGrid(); }
      else { ARCHIVE_ENTRIES = getCombinedArchive(); renderArchiveGrid(); }
      
      showToast("商品已置頂");
    },
    simulateOrder: (id, type = "survey") => simulateOrder(id, type),
    deleteOrder: (id) => deleteOrder(id),
    updateOrderStatus: (id, newStatus) => updateOrderStatus(id, newStatus),
    escapeHtml: escapeHtml
  };
})();
