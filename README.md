# Xiaoju Gardening House · 購買意願調查

靜態網頁：瀏覽「照片回顾」實拍，填寫願意支付的價格（RM）。資料儲存在訪客瀏覽器本機（localStorage）。

## 上傳到 GitHub 前請確認

1. **務必一併提交 `照片回顾` 資料夾**（內含所有 `.jpg`）。若只推 `index.html` / `app.js` / `styles.css`，網站上圖片會全部破圖。
2. **`app.js` 內 `PHOTO_ENTRIES`**（檔名＋分類）須與 `照片回顾` 裡實際檔名一致；若重新命名或增刪照片，請同步修改列表與對應分類。
3. 本專案為純前端，**無後端**；意願資料不會上傳到 GitHub，僅存在使用者自己的瀏覽器。
4. 「複製清單」使用剪貼簿 API，在 **HTTPS**（例如 GitHub Pages）下可正常運作；若用 `file://` 開本機檔案，部分瀏覽器可能無法複製。

## 本地預覽（可選）

在專案根目錄執行：

```bash
python -m http.server 8080
```

瀏覽器開啟 `http://127.0.0.1:8080/index.html`。

## 建立儲存庫並推送

```bash
git init
git add .
git commit -m "Initial commit: 購買意願調查頁"
git branch -M main
git remote add origin https://github.com/你的帳號/你的儲存庫名稱.git
git push -u origin main
```

## 啟用 GitHub Pages

1. 儲存庫 **Settings → Pages**。
2. **Source** 選 **Deploy from a branch**，Branch 選 `main`，資料夾選 `/ (root)`。
3. 儲存後約 1～2 分鐘，網址會出現在同一頁（格式通常為 `https://你的帳號.github.io/儲存庫名稱/`）。

根目錄已有 `index.html`，無需額外建置步驟。

## 手機版／電腦版

- **樣式**：`styles.css` 以螢幕寬度 **768px** 為界：≤768px 為手機版面（主內容在上、分類橫向捲動、單欄商品、較大觸控區）；寬螢幕為電腦版面。
- **腳本**：`device.js` 會在 `<html>` 加上 `is-mobile` / `is-desktop`，並設定 `data-viewport`，旋轉或改變視窗寬度時會更新。可在主控台使用 `window.__DEVICE__.isMobile()`。

## 檔案結構（預期）

```
意愿调查/
├── index.html
├── styles.css
├── device.js
├── app.js
├── README.md
├── .gitignore
├── 头像/
│   └── （頁首頭像圖片，檔名須與 `index.html` 內 `<img src>` 一致）
├── 预定照片/
│   └── （預定產品固定價用圖，檔名須與 `app.js` 內 `PREORDER_ENTRIES` 一致）
└── 照片回顾/
    └── *.jpg
```

### 預定產品（固定價）

- 品項與價格在 `app.js` 的 **`PREORDER_ENTRIES`** 設定；圖片放在 **`预定照片`**。
- 目前範例：85CM 金馬倫多肉 **RM12**、預訂單品項 **RM3.80**（第二張圖請使用檔名 `金马伦多肉植物 （预定单）.jpg` 並放入資料夾，否則該卡圖片會無法顯示）。
