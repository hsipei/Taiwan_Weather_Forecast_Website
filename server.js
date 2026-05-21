const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const CWA_API_KEY = process.env.CWA_API_KEY;

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 中央氣象署 API 基礎網址
const CWA_BASE_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

/**
 * 共用的 CWA API 請求函式
 * 使用 Header 傳遞授權碼，避免被 WAF 擋掉
 */
async function fetchCWA(datasetId, params = {}) {
  const queryParams = new URLSearchParams(params);
  const url = `${CWA_BASE_URL}/${datasetId}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': CWA_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CWA API 回應錯誤 (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.json();
}

/**
 * 取得一般天氣預報 - 今明36小時天氣預報
 * 資料集代碼：F-C0032-001
 */
app.get('/api/forecast/36hr', async (req, res) => {
  try {
    const { locationName } = req.query;
    const params = {};
    if (locationName) {
      params.locationName = locationName;
    }

    const data = await fetchCWA('F-C0032-001', params);

    if (data.success === 'true' || data.success === true) {
      res.json({
        success: true,
        data: data.records.location
      });
    } else {
      res.status(400).json({
        success: false,
        message: '無法取得天氣資料'
      });
    }
  } catch (error) {
    console.error('取得36小時預報失敗:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 取得一般天氣預報 - 未來 1 週天氣預報
 * 資料集代碼：F-D0047-091
 */
app.get('/api/forecast/week', async (req, res) => {
  try {
    const { locationName } = req.query;
    const params = {};
    if (locationName) {
      // F-D0047-091 API 參數需使用大寫 LocationName
      params.LocationName = locationName;
    }

    const data = await fetchCWA('F-D0047-091', params);

    if (data.success === 'true' || data.success === true) {
      const records = data.records;

      let locations = null;
      const locationsArr = records.Locations || records.locations;
      if (locationsArr && Array.isArray(locationsArr) && locationsArr.length > 0) {
        locations = locationsArr[0].Location || locationsArr[0].location;
      }
      if (!locations) {
        locations = records.Location || records.location;
      }

      // 若 API 未正確過濾，在後端手動過濾指定縣市
      if (locations && locations.length > 1 && locationName) {
        const filtered = locations.filter(loc => {
          const name = loc.LocationName || loc.locationName;
          return name === locationName;
        });
        if (filtered.length > 0) {
          locations = filtered;
        }
      }

      if (locations && locations.length > 0) {
        res.json({
          success: true,
          data: locations
        });
      } else {
        res.status(404).json({
          success: false,
          message: '查無天氣預報資料'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: '無法取得一週天氣資料，請確認 API 授權碼是否正確'
      });
    }
  } catch (error) {
    console.error('取得一週預報失敗:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 取得目前天氣觀測資料
 * 資料集代碼：O-A0003-001 (自動氣象站觀測資料)
 */
app.get('/api/observation', async (req, res) => {
  try {
    const data = await fetchCWA('O-A0003-001', {});

    if (data.success === 'true' || data.success === true) {
      res.json({
        success: true,
        data: data.records.Station
      });
    } else {
      res.status(400).json({
        success: false,
        message: '無法取得觀測資料'
      });
    }
  } catch (error) {
    console.error('取得觀測資料失敗:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * 除錯用：直接查看 CWA API 原始回傳
 * 瀏覽器開啟 http://localhost:3000/api/debug/week 即可查看
 */
app.get('/api/debug/week', async (req, res) => {
  try {
    const { locationName } = req.query;
    const params = {};
    if (locationName) {
      params.locationName = locationName;
    } else {
      params.locationName = '臺北市'; // 預設查一個縣市減少資料量
    }

    console.log('除錯請求 F-D0047-091, params:', params);
    const data = await fetchCWA('F-D0047-091', params);

    const records = data.records;
    const locationsArr = records?.Locations || records?.locations;
    const firstGroup = locationsArr?.[0];
    const locationList = firstGroup?.Location || firstGroup?.location;
    const firstLocation = locationList?.[0];
    const weatherElements = firstLocation?.WeatherElement || firstLocation?.weatherElement;
    const firstElement = weatherElements?.[0];

    res.json({
      apiSuccess: data.success,
      recordKeys: records ? Object.keys(records) : null,
      firstGroupKeys: firstGroup ? Object.keys(firstGroup) : null,
      locationCount: locationList?.length || 0,
      firstLocationKeys: firstLocation ? Object.keys(firstLocation) : null,
      firstLocationName: firstLocation?.LocationName || firstLocation?.locationName,
      weatherElementCount: weatherElements?.length || 0,
      weatherElementNames: weatherElements?.map(e => e.ElementName || e.elementName) || [],
      firstElementSample: firstElement ? {
        name: firstElement.ElementName || firstElement.elementName,
        keys: Object.keys(firstElement),
        timeKey: firstElement.Time ? 'Time' : firstElement.time ? 'time' : 'none',
        timeCount: (firstElement.Time || firstElement.time)?.length || 0,
        firstTime: (firstElement.Time || firstElement.time)?.[0]
      } : null
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      hint: '如果出現 WAF 被擋或 403 錯誤，請確認 API Key 是否有效'
    });
  }
});

// 所有其他路由導向前端
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`天氣預報伺服器已啟動: http://localhost:${PORT}`);
  if (!CWA_API_KEY || CWA_API_KEY === 'your_api_key_here') {
    console.warn('⚠️  請在 .env 檔案中設定 CWA_API_KEY');
    console.warn('   前往 https://opendata.cwa.gov.tw/ 註冊取得授權碼');
  }
});
