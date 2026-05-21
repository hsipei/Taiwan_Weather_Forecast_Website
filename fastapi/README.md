# 台灣天氣預報網站 - FastAPI 後端

使用 FastAPI + Python 實作的後端，功能與 Node.js 版完全相同。

## 安裝與執行

### 1. 建立虛擬環境（建議）

```bash
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
```

### 2. 安裝相依套件

```bash
pip install -r requirements.txt
```

### 3. 設定環境變數

編輯 `.env` 檔案，填入你的中央氣象署 API 授權碼：

```
CWA_API_KEY=你的授權碼
PORT=3000
```

### 4. 啟動伺服器

```bash
python main.py
```

或使用 uvicorn 直接啟動（支援熱重載）：

```bash
uvicorn main:app --reload --port 3000
```

開啟瀏覽器前往 http://localhost:3000 即可使用。

## API 端點

| 路徑 | 說明 | 參數 |
|------|------|------|
| `GET /api/forecast/36hr` | 今明36小時天氣預報 | `locationName`（選填） |
| `GET /api/forecast/week` | 未來1週天氣預報 | `locationName`（選填） |
| `GET /api/observation` | 自動氣象站觀測資料 | 無 |
| `GET /api/debug/week` | 除錯用原始回傳 | `locationName`（選填） |

## API 文件

FastAPI 自動產生互動式 API 文件：

- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

## 專案結構

```
fastapi/
├── main.py            # FastAPI 後端主程式
├── requirements.txt   # Python 相依套件
├── .env               # 環境變數
├── .env.example       # 環境變數範例
└── README.md
```

## 前端

本後端共用上層 `public/` 資料夾的前端檔案，無需額外設定。
