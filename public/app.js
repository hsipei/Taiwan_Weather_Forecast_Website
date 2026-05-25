/**
 * 台灣天氣預報前端應用程式
 * 資料來源：中央氣象署開放資料平台
 */

const CWA_API_KEY = CWA-B99E63D1-F939-4176-8D01-35287E16C0CE;



// DOM 元素
const citySelect = document.getElementById('city-select');
const searchBtn = document.getElementById('search-btn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');
const forecast36hrCards = document.getElementById('forecast-36hr-cards');
const forecastWeekCards = document.getElementById('forecast-week-cards');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// 天氣描述對應圖示
const weatherIcons = {
  '晴': '☀️',
  '晴時多雲': '🌤️',
  '多雲時晴': '⛅',
  '多雲': '☁️',
  '多雲時陰': '☁️',
  '陰時多雲': '🌥️',
  '陰': '🌫️',
  '陰有雨': '🌧️',
  '多雲短暫雨': '🌦️',
  '多雲時陰短暫雨': '🌧️',
  '陰短暫雨': '🌧️',
  '陰有陣雨': '🌧️',
  '多雲陣雨': '🌦️',
  '短暫雨': '🌧️',
  '有雨': '🌧️',
  '陣雨': '🌦️',
  '雷雨': '⛈️',
  '多雲時晴短暫雨': '🌦️',
  '晴時多雲短暫雨': '🌦️',
  '多雲短暫陣雨': '🌦️',
  '午後短暫雷陣雨': '⛈️',
  '多雲午後短暫雷陣雨': '⛈️',
};

/**
 * 從 ElementValue 陣列中取出第一個有效值
 * API 回傳格式如：[{ "Temperature": "21" }] 或 [{ "Weather": "晴時多雲" }]
 * key 名稱不固定，所以取第一個物件的第一個 value
 */
function getFirstValue(elementValues) {
  if (!elementValues || elementValues.length === 0) return null;
  const firstObj = elementValues[0];
  if (!firstObj) return null;
  // 取物件中第一個 key 的值
  const keys = Object.keys(firstObj);
  if (keys.length === 0) return null;
  return firstObj[keys[0]];
}

/**
 * 根據天氣描述取得對應圖示
 */
function getWeatherIcon(description) {
  if (!description) return '🌡️';
  // 嘗試精確匹配
  if (weatherIcons[description]) return weatherIcons[description];
  // 模糊匹配
  if (description.includes('雷')) return '⛈️';
  if (description.includes('雨')) return '🌧️';
  if (description.includes('陰')) return '🌫️';
  if (description.includes('雲')) return '⛅';
  if (description.includes('晴')) return '☀️';
  return '🌡️';
}

/**
 * 顯示/隱藏載入動畫
 */
function showLoading(show) {
  loadingEl.classList.toggle('hidden', !show);
}

/**
 * 顯示錯誤訊息
 */
function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

/**
 * 隱藏錯誤訊息
 */
function hideError() {
  errorEl.classList.add('hidden');
}

/**
 * 格式化時間
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  return `${month}/${day} ${hour}:00`;
}

/**
 * 取得36小時天氣預報 (修改為直接請求氣象署 API)
 */
async function fetchForecast36hr(locationName) {
  try {
    showLoading(true);
    hideError();

    // 1. 建立氣象署 36小時天氣預報 (F-C0032-001) 的完整 URL
    let url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${CWA_API_KEY}&format=JSON`;
    
    // 如果使用者有選擇特定縣市，加上篩選條件
    if (locationName && locationName !== '全部縣市') {
      url += `&locationName=${encodeURIComponent(locationName)}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
    }

    const result = await response.json();

    // 2. 解析氣象署回傳的結構，並模擬原本後端傳回的格式 { success: true, data: [...] }
    if (result.success === 'true' || result.success === true) {
      // 氣象署的縣市資料陣列位在 records.location
      const locations = result.records?.location || [];
      render36hrForecast(locations);
    } else {
      showError(result.message || '無法取得天氣資料');
    }
  } catch (error) {
    console.error('取得預報失敗:', error);
    showError('網路連線失敗，請檢查 API Key 或稍後再試');
  } finally {
    showLoading(false);
  }
}

/**
 * 取得一週天氣預報 (修改為直接請求氣象署 API)
 */
async function fetchForecastWeek(locationName) {
  try {
    showLoading(true);
    hideError();

    // 1. 建立氣象署 臺灣各縣市未來1週天氣預報 (F-D0047-091) 的完整 URL
    let url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=${CWA_API_KEY}&format=JSON`;
    
    if (locationName && locationName !== '全部縣市') {
      url += `&locationName=${encodeURIComponent(locationName)}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
    }

    const result = await response.json();

    // 2. 解析一週預報的結構
    // F-D0047-091 回傳的結構是 records.locations[0].location
    if (result.success === 'true' || result.success === true) {
      const locationsContainer = result.records?.locations?.[0] || {};
      const locations = locationsContainer.location || [];
      renderWeekForecast(locations);
    } else {
      showError(result.message || '無法取得一週天氣資料');
    }
  } catch (error) {
    console.error('取得一週預報失敗:', error);
    showError('網路連線失敗，請檢查 API Key 或稍後再試');
  } finally {
    showLoading(false);
  }
}

/**
 * 取得36小時天氣預報

async function fetchForecast36hr(locationName) {
  try {
    showLoading(true);
    hideError();

    let url = '/api/forecast/36hr';
    if (locationName) {
      url += `?locationName=${encodeURIComponent(locationName)}`;
    }

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      render36hrForecast(result.data);
    } else {
      showError(result.message || '無法取得天氣資料');
    }
  } catch (error) {
    console.error('取得預報失敗:', error);
    showError('網路連線失敗，請稍後再試');
  } finally {
    showLoading(false);
  }
}


 * 取得一週天氣預報
 
async function fetchForecastWeek(locationName) {
  try {
    showLoading(true);
    hideError();

    let url = '/api/forecast/week';
    if (locationName) {
      url += `?locationName=${encodeURIComponent(locationName)}`;
    }

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      renderWeekForecast(result.data);
    } else {
      showError(result.message || '無法取得一週天氣資料');
    }
  } catch (error) {
    console.error('取得一週預報失敗:', error);
    showError('網路連線失敗，請稍後再試');
  } finally {
    showLoading(false);
  }
}
*/

/**
 * 渲染36小時預報卡片
 */
function render36hrForecast(locations) {
  if (!locations || locations.length === 0) {
    forecast36hrCards.innerHTML = '<div class="no-data">目前無可用的天氣資料</div>';
    return;
  }

  forecast36hrCards.innerHTML = locations.map(location => {
    const elements = location.weatherElement;

    // 取得各項天氣資訊
    const wx = elements.find(e => e.elementName === 'Wx'); // 天氣現象
    const pop = elements.find(e => e.elementName === 'PoP'); // 降雨機率
    const minT = elements.find(e => e.elementName === 'MinT'); // 最低溫
    const maxT = elements.find(e => e.elementName === 'MaxT'); // 最高溫
    const ci = elements.find(e => e.elementName === 'CI'); // 舒適度

    // 取得第一個時段的資料
    const currentWx = wx?.time[0]?.parameter?.parameterName || '無資料';
    const currentPop = pop?.time[0]?.parameter?.parameterName || '-';
    const currentMinT = minT?.time[0]?.parameter?.parameterName || '-';
    const currentMaxT = maxT?.time[0]?.parameter?.parameterName || '-';
    const currentCi = ci?.time[0]?.parameter?.parameterName || '';

    const icon = getWeatherIcon(currentWx);

    return `
      <div class="weather-card">
        <div class="city-name">${location.locationName}</div>
        <div class="weather-icon">${icon}</div>
        <div class="weather-desc">${currentWx}</div>
        <div class="weather-info">
          <div class="weather-info-item">
            <span class="label">🌡️ 溫度</span>
            <span class="value">${currentMinT}°C - ${currentMaxT}°C</span>
          </div>
          <div class="weather-info-item">
            <span class="label">💧 降雨機率</span>
            <span class="value">${currentPop}%</span>
          </div>
          <div class="weather-info-item">
            <span class="label">😊 舒適度</span>
            <span class="value">${currentCi}</span>
          </div>
          <div class="weather-info-item">
            <span class="label">⏰ 預報時段</span>
            <span class="value">${formatTime(wx?.time[0]?.startTime)} ~ ${formatTime(wx?.time[0]?.endTime)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染一週預報卡片
 * F-D0047-091 API 實際回傳結構：
 * Location[].WeatherElement[].Time[].ElementValue[{ key: value }]
 * 
 * WeatherElement 名稱為中文：天氣現象、最高溫度、最低溫度、12小時降雨機率 等
 * ElementValue 為物件陣列，key 為具體名稱如 Temperature、Weather 等
 */
function renderWeekForecast(locations) {
  if (!locations || locations.length === 0) {
    forecastWeekCards.innerHTML = '<div class="no-data">目前無可用的一週天氣資料</div>';
    return;
  }

  forecastWeekCards.innerHTML = locations.map(location => {
    const elements = location.WeatherElement || location.weatherElement;
    const cityName = location.LocationName || location.locationName;

    if (!elements || elements.length === 0) {
      return `
        <div class="weather-card">
          <div class="city-name">${cityName}</div>
          <p>暫無預報資料</p>
        </div>
      `;
    }

    // 用中文名稱查找天氣要素
    const findElement = (name) => elements.find(e =>
      (e.ElementName || e.elementName) === name
    );

    const wx = findElement('天氣現象');
    const minT = findElement('最低溫度');
    const maxT = findElement('最高溫度');
    const pop = findElement('12小時降雨機率');
    const desc = findElement('天氣預報綜合描述');

    // 取得時段資料
    const wxTimes = wx?.Time || wx?.time || [];
    const periods = wxTimes.slice(0, 14); // 一週約14個時段

    if (periods.length === 0) {
      return `
        <div class="weather-card">
          <div class="city-name">${cityName}</div>
          <p>暫無時段預報資料</p>
        </div>
      `;
    }

    const periodsHtml = periods.map((period, index) => {
      // ElementValue 是物件陣列，取第一個物件的第一個 value
      const elemValues = period.ElementValue || period.elementValue || [];
      const weatherDesc = getFirstValue(elemValues) || '無資料';
      const icon = getWeatherIcon(weatherDesc);

      // 溫度
      const minTTimes = minT?.Time || minT?.time || [];
      const maxTTimes = maxT?.Time || maxT?.time || [];
      const minEV = minTTimes[index]?.ElementValue || minTTimes[index]?.elementValue || [];
      const maxEV = maxTTimes[index]?.ElementValue || maxTTimes[index]?.elementValue || [];
      const min = getFirstValue(minEV) || '-';
      const max = getFirstValue(maxEV) || '-';

      // 降雨機率（時段數量可能與天氣現象不同）
      const popTimes = pop?.Time || pop?.time || [];
      const rain = getFirstValue(popTimes[index]?.ElementValue || popTimes[index]?.elementValue || []) || '-';

      // 時間
      const startTime = period.StartTime || period.startTime;
      const endTime = period.EndTime || period.endTime;

      return `
        <div class="period-item">
          <span class="period-time">${formatTime(startTime)} ~ ${formatTime(endTime)}</span>
          <span class="period-weather">${icon} ${weatherDesc}</span>
          <span class="period-temp">${min}°C - ${max}°C ${rain !== '-' && rain !== ' ' ? '💧' + rain + '%' : ''}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="weather-card">
        <div class="city-name">${cityName}</div>
        <div class="week-forecast-periods">
          ${periodsHtml}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 頁籤切換
 */
function switchTab(tabName) {
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });
}

/**
 * 搜尋天氣
 */
function searchWeather() {
  const locationName = citySelect.value;
  const activeTab = document.querySelector('.tab.active').dataset.tab;

  if (activeTab === 'forecast-36hr') {
    fetchForecast36hr(locationName);
  } else if (activeTab === 'forecast-week') {
    fetchForecastWeek(locationName);
  }
}

// 事件監聽
searchBtn.addEventListener('click', searchWeather);

citySelect.addEventListener('change', searchWeather);

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    switchTab(tabName);
    searchWeather();
  });
});

// 頁面載入時自動取得資料
document.addEventListener('DOMContentLoaded', () => {
  fetchForecast36hr('');
});
