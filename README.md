# 台灣天氣預報網站

使用中央氣象署（CWA）開放資料平台 API 建立的天氣預報網站。

## 功能

- 📋 全台 22 縣市 36 小時天氣預報
- 🔍 依縣市篩選查詢
- 📱 響應式設計，支援手機與桌面瀏覽
- 🎨 美觀的天氣圖示與卡片式介面

## 技術架構

- **後端**：Node.js + Express
- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **資料來源**：中央氣象署開放資料平台 API

## 使用的 API 資料集

| 資料集代碼 | 說明 |
|-----------|------|
| F-C0032-001 | 一般天氣預報 - 今明 36 小時天氣預報 |
| O-A0003-001 | 自動氣象站觀測資料 |

## 安裝與執行

### 1. 取得授權碼

前往 [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/) 註冊帳號並取得 API 授權碼。

### 2. 安裝相依套件

```bash
npm install
```

### 3. 設定環境變數

將 `.env.example` 複製為 `.env`，並填入你的授權碼：

```bash
copy .env.example .env
```

編輯 `.env` 檔案：

```
CWA_API_KEY=你的授權碼
PORT=3000
```

### 4. 啟動伺服器

```bash
npm start
```

開啟瀏覽器前往 http://localhost:3000 即可使用。

## 專案結構

```
├── server.js          # Express 後端伺服器
├── public/
│   ├── index.html     # 前端頁面
│   ├── styles.css     # 樣式表
│   └── app.js         # 前端 JavaScript
├── package.json       # 專案設定
├── .env.example       # 環境變數範例
├── .env               # 環境變數（不納入版控）
└── .gitignore
```
