/* ============================================
   JYOTISHFLOW — PANCHANG.JS — API ENGINE v2
   Corrected endpoints for freeastrologyapi.com
   ============================================ */

const API_BASE = "https://json.freeastrologyapi.com";

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

// ── MAIN LOAD FUNCTION ──────────────────────────
async function loadPanchang(chart) {
  console.log("🌊 JyotishFlow: Loading cosmic data v2...");

  // Call each endpoint individually
  const [
    karanaData,
    yogaData,
    tithiData,
    nakshatraData,
    weekdayData,
    sunData,
    rahuData,
    gulikaData,
    yamaData,
    abhijitData,
    amritData,
    durData,
    varjyamData
  ] = await Promise.all([
    apiCall("karana-durations",    chart),
    apiCall("yoga-durations",      chart),
    apiCall("tithi-durations",     chart),
    apiCall("nakshatra-durations", chart),
    apiCall("vedicweekday",        chart),
    apiCall("getsunriseandset",    chart),
    apiCall("rahu-kalam",          chart),
    apiCall("gulika-kalam",        chart),
    apiCall("yama-gandam",         chart),
    apiCall("abhijit-muhurat",     chart),
    apiCall("amrit-kaal",          chart),
    apiCall("dur-muhurat",         chart),
    apiCall("varjyam",             chart)
  ]);

  // ── KARANA ──────────────────────────────────
  // Returns array of karanas for the day
  let karanaName = '--';
  let karanaEnd  = '--';
  if (Array.isArray(karanaData)) {
    // Find the currently active karana
    const now = new Date();
    const active = karanaData.find(k => {
      const end = new Date(`${now.toDateString()} ${k.end_time || k.upto}`);
      return now < end;
    }) || karanaData[0];
    if (active) {
      karanaName = dig(active, 'name', 'karana_name') || '--';
      karanaEnd  = fmt(dig(active, 'end_time', 'upto'));
    }
  } else if (karanaData) {
    karanaName = dig(karanaData, 'name', 'karana_name') || '--';
    karanaEnd  = fmt(dig(karanaData, 'end_time', 'upto'));
  }

  // ── YOGA ────────────────────────────────────
  let yogaName = '--';
  let yogaEnd  = '--';
  if (Array.isArray(yogaData)) {
    const now = new Date();
    const active = yogaData.find(y => {
      const end = new Date(`${now.toDateString()} ${y.end_time || y.upto}`);
      return now < end;
    }) || yogaData[0];
    if (active) {
      yogaName = dig(active, 'name', 'yoga_name') || '--';
      yogaEnd  = fmt(dig(active, 'end_time', 'upto'));
    }
  } else if (yogaData) {
    yogaName = dig(yogaData, 'name', 'yoga_name') || '--';
    yogaEnd  = fmt(dig(yogaData, 'end_time', 'upto'));
  }

  // ── TITHI ────────────────────────────────────
  let tithiName   = '--';
  let tithiEnd    = '--';
  let tithiNumber = 0;
  if (Array.isArray(tithiData)) {
    const t = tithiData[0];
    if (t) {
      tithiName   = dig(t, 'name', 'tithi_name') || '--';
      tithiEnd    = fmt(dig(t, 'end_time', 'upto'));
      tithiNumber = dig(t, 'number', 'tithi_number') || 0;
    }
  } else if (tithiData) {
    tithiName   = dig(tithiData, 'name', 'tithi_name') || '--';
    tithiEnd    = fmt(dig(tithiData, 'end_time', 'upto'));
    tithiNumber = dig(tithiData, 'number', 'tithi_number') || 0;
  }

  // ── NAKSHATRA ────────────────────────────────
  let nakshatraName = '--';
  let nakshatraEnd  = '--';
  if (Array.isArray(nakshatraData)) {
    const n = nakshatraData[0];
    if (n) {
      nakshatraName = dig(n, 'name', 'nakshatra_name') || '--';
      nakshatraEnd  = fmt(dig(n, 'end_time', 'upto'));
    }
  } else if (nakshatraData) {
    nakshatraName = dig(nakshatraData, 'name', 'nakshatra_name') || '--';
    nakshatraEnd  = fmt(dig(nakshatraData, 'end_time', 'upto'));
  }

  // ── WEEKDAY ──────────────────────────────────
  let weekday = '--';
  if (weekdayData) {
    weekday = dig(weekdayData,
      'weekday_name', 'name', 'day', 'vedic_weekday_name'
    ) || '--';
  }

  // ── SUNRISE / SUNSET ─────────────────────────
  let sunrise = '--';
  let sunset  = '--';
  if (sunData) {
    sunrise = fmt(dig(sunData, 'sunrise', 'sun_rise'));
    sunset  = fmt(dig(sunData, 'sunset',  'sun_set'));
  }

  // ── RAHU KALAM ───────────────────────────────
  const rahuTime   = timeRange(rahuData);

  // ── GULIKA KALAM ─────────────────────────────
  const gulikaTime = timeRange(gulikaData);

  // ── YAMAGANDA ────────────────────────────────
  const yamaTime   = timeRange(yamaData);

  // ── ABHIJIT MUHURTA ──────────────────────────
  const abhijitTime = timeRange(abhijitData);

  // ── AMRIT KAAL ───────────────────────────────
  const amritTime  = timeRange(amritData);

  // ── DUR MUHURAT ──────────────────────────────
  let durTime = '--';
  if (Array.isArray(durData) && durData.length > 0) {
    durTime = durData.map(d => timeRange(d)).join(' · ');
  } else if (durData) {
    durTime = timeRange(durData);
  }

  // ── VARJYAM ──────────────────────────────────
  const varjyamTime = timeRange(varjyamData);

  // ── RETURN UNIFIED DATA ───────────────────────
  const result = {
    karanaName,  karanaEnd,
    yogaName,    yogaEnd,
    tithiName,   tithiEnd,   tithiNumber,
    nakshatraName, nakshatraEnd,
    weekday,
    sunrise,     sunset,
    rahuTime,    gulikaTime,  yamaTime,
    abhijitTime, amritTime,
    durTime,     varjyamTime
  };

  console.log("🌊 JyotishFlow final data:", result);
  return result;
}