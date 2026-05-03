/* ============================================
   JYOTISHFLOW — PANCHANG.JS — API ENGINE v3
   Sequential calls to respect rate limit
   ============================================ */

const API_BASE = "https://json.freeastrologyapi.com";

// ── DELAY HELPER ────────────────────────────────
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ── BUILD REQUEST BODY ──────────────────────────
function buildBody(chart) {
  const now = new Date();
  return {
    year:      now.getFullYear(),
    month:     now.getMonth() + 1,
    date:      now.getDate(),
    hours:     now.getHours(),
    minutes:   now.getMinutes(),
    seconds:   now.getSeconds(),
    latitude:  chart.latitude,
    longitude: chart.longitude,
    timezone:  chart.timezone,
    config: {
      observation_point: "topocentric",
      ayanamsha:         "lahiri"
    }
  };
}

// ── SINGLE API CALL ─────────────────────────────
async function apiCall(endpoint, chart) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key":    chart.apiKey
      },
      body: JSON.stringify(buildBody(chart))
    });
    if (!res.ok) {
      console.warn(`❌ ${endpoint} failed: ${res.status}`);
      return null;
    }
    const data = await res.json();
    console.log(`✅ ${endpoint}:`, data);
    return data;
  } catch (e) {
    console.warn(`❌ ${endpoint} error:`, e.message);
    return null;
  }
}

// ── SEQUENTIAL API CALL WITH DELAY ──────────────
async function apiCallSafe(endpoint, chart) {
  await delay(1100); // 1.1 seconds between calls
  return apiCall(endpoint, chart);
}

// ── FORMAT TIME HELPER ──────────────────────────
function fmt(val) {
  if (!val) return '--';
  return String(val);
}

// ── SAFE GET NESTED VALUE ───────────────────────
function dig(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return null;
}

// ── PARSE TIME RANGE ────────────────────────────
function timeRange(obj) {
  if (!obj) return '--';
  const start = dig(obj, 'start', 'start_time', 'starting_time');
  const end   = dig(obj, 'end',   'end_time',   'ending_time');
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  if (start) return fmt(start);
  return '--';
}

// ── PARSE ACTIVE ITEM FROM ARRAY ─────────────────
function parseActive(data, nameKeys, timeKey) {
  if (!data) return { name: '--', end: '--' };

  const arr = Array.isArray(data) ? data : [data];
  const now = new Date();

  // Try to find currently active item
  let active = arr.find(item => {
    const endStr = dig(item, timeKey, 'end_time', 'upto', 'end');
    if (!endStr) return false;
    const endDate = new Date(`${now.toDateString()} ${endStr}`);
    return !isNaN(endDate) && now < endDate;
  });

  // Fall back to first item
  if (!active) active = arr[0];
  if (!active) return { name: '--', end: '--' };

  const name = dig(active, ...nameKeys) || '--';
  const end  = fmt(dig(active, timeKey, 'end_time', 'upto', 'end'));

  return { name, end };
}

// ── MAIN LOAD FUNCTION ──────────────────────────
async function loadPanchang(chart) {
  console.log("🌊 JyotishFlow: Loading cosmic data v3 (sequential)...");

  // Call sequentially with delay to respect 1 req/sec limit
  const karanaData    = await apiCall("karana-durations",    chart);
  const yogaData      = await apiCallSafe("yoga-durations",      chart);
  const tithiData     = await apiCallSafe("tithi-durations",     chart);
  const nakshatraData = await apiCallSafe("nakshatra-durations", chart);
  const weekdayData   = await apiCallSafe("vedicweekday",        chart);
  const sunData       = await apiCallSafe("getsunriseandset",    chart);
  const rahuData      = await apiCallSafe("rahu-kalam",          chart);
  const gulikaData    = await apiCallSafe("gulika-kalam",        chart);
  const yamaData      = await apiCallSafe("yama-gandam",         chart);
  const abhijitData   = await apiCallSafe("abhijit-muhurat",     chart);
  const amritData     = await apiCallSafe("amrit-kaal",          chart);
  const durData       = await apiCallSafe("dur-muhurat",         chart);
  const varjyamData   = await apiCallSafe("varjyam",             chart);

  // ── PARSE KARANA ─────────────────────────────
  const karana = parseActive(karanaData,
    ['name', 'karana_name'], 'end_time');

  // ── PARSE YOGA ───────────────────────────────
  const yoga = parseActive(yogaData,
    ['name', 'yoga_name'], 'end_time');

  // ── PARSE TITHI ──────────────────────────────
  const tithiArr = Array.isArray(tithiData) ? tithiData : [tithiData];
  const tithiItem = tithiArr[0] || {};
  const tithiName   = dig(tithiItem, 'name', 'tithi_name') || '--';
  const tithiEnd    = fmt(dig(tithiItem, 'end_time', 'upto'));
  const tithiNumber = dig(tithiItem, 'number', 'tithi_number') || 0;

  // ── PARSE NAKSHATRA ──────────────────────────
  const nakshatra = parseActive(nakshatraData,
    ['name', 'nakshatra_name'], 'end_time');

  // ── PARSE WEEKDAY ────────────────────────────
  let weekday = '--';
  if (weekdayData) {
    weekday = dig(weekdayData,
      'weekday_name', 'name', 'day', 'vedic_weekday_name') || '--';
  }

  // ── PARSE SUNRISE/SUNSET ─────────────────────
  let sunrise = '--';
  let sunset  = '--';
  if (sunData) {
    sunrise = fmt(dig(sunData, 'sunrise', 'sun_rise'));
    sunset  = fmt(dig(sunData, 'sunset',  'sun_set'));
  }

  // ── PARSE TIME WINDOWS ────────────────────────
  const rahuTime    = timeRange(rahuData);
  const gulikaTime  = timeRange(gulikaData);
  const yamaTime    = timeRange(yamaData);
  const abhijitTime = timeRange(abhijitData);
  const amritTime   = timeRange(amritData);
  const varjyamTime = timeRange(varjyamData);

  let durTime = '--';
  if (Array.isArray(durData) && durData.length > 0) {
    durTime = durData.map(d => timeRange(d)).join(' · ');
  } else if (durData) {
    durTime = timeRange(durData);
  }

  // ── RETURN UNIFIED DATA ───────────────────────
  const result = {
    karanaName:    karana.name,
    karanaEnd:     karana.end,
    yogaName:      yoga.name,
    yogaEnd:       yoga.end,
    tithiName,     tithiEnd,   tithiNumber,
    nakshatraName: nakshatra.name,
    nakshatraEnd:  nakshatra.end,
    weekday,
    sunrise,       sunset,
    rahuTime,      gulikaTime,  yamaTime,
    abhijitTime,   amritTime,
    durTime,       varjyamTime
  };

  console.log("🌊 JyotishFlow final data:", result);
  return result;
}