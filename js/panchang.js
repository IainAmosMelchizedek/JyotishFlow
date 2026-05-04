/* ============================================
   JYOTISHFLOW — PANCHANG.JS — FREE ASTROLOGY API v8
   Sequential calls — Boston MA — Lahiri Ayanamsha
   ============================================ */

const API_BASE = "https://json.freeastrologyapi.com";

// ── DELAY ───────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── BUILD REQUEST BODY ──────────────────────────
function buildBody(chart) {
  const now = new Date();
  return JSON.stringify({
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
  });
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
      body: buildBody(chart)
    });

    if (!res.ok) {
      console.warn(`❌ ${endpoint} failed: ${res.status}`);
      return null;
    }

    const json = await res.json();
    console.log(`✅ ${endpoint}:`, json);
    return json;

  } catch(e) {
    console.warn(`❌ ${endpoint} error:`, e.message);
    return null;
  }
}

// ── PARSE OUTPUT FIELD ──────────────────────────
function parseOutput(json) {
  if (!json) return null;
  try {
    if (typeof json.output === 'string') {
      return JSON.parse(json.output);
    }
    return json.output || json;
  } catch(e) {
    return null;
  }
}

// ── FORMAT TIME ─────────────────────────────────
function fmt(val) {
  if (!val) return '--';
  try {
    const clean = String(val).replace(/"/g, '').trim();
    const parts = clean.split(' ');
    const timePart = parts[1] || parts[0];
    const [h, m]  = timePart.split(':').map(Number);
    const ampm    = h >= 12 ? 'PM' : 'AM';
    const h12     = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
  } catch(e) {
    return String(val);
  }
}

function fmtRange(start, end) {
  if (!start || !end) return '--';
  return `${fmt(start)} — ${fmt(end)}`;
}

// ── FIND ACTIVE ITEM ────────────────────────────
function findActive(obj) {
  if (!obj) return null;
  const now = new Date();
  const entries = Object.values(obj);

  // Find currently active entry
  for (const entry of entries) {
    const completion = entry.completion || entry.end_time;
    if (!completion) continue;
    const endDate = new Date(completion);
    if (!isNaN(endDate) && now < endDate) return entry;
  }

  // Fall back to first entry
  return entries[0] || null;
}

// ── MAIN LOAD FUNCTION ──────────────────────────
async function loadPanchang(chart) {
  console.log("🌊 JyotishFlow v8: Loading from freeastrologyapi.com...");

  // Sequential calls with 1.2 second delay between each
  const karanaRaw    = await apiCall("karana-durations",    chart); await delay(1200);
  const yogaRaw      = await apiCall("yoga-durations",      chart); await delay(1200);
  const tithiRaw     = await apiCall("tithi-durations",     chart); await delay(1200);
  const nakshatraRaw = await apiCall("nakshatra-durations", chart); await delay(1200);
  const weekdayRaw   = await apiCall("vedicweekday",        chart); await delay(1200);
  const sunRaw       = await apiCall("getsunriseandset",    chart); await delay(1200);
  const rahuRaw      = await apiCall("rahu-kalam",          chart); await delay(1200);
  const gulikaRaw    = await apiCall("gulika-kalam",        chart); await delay(1200);
  const yamaRaw      = await apiCall("yama-gandam",         chart); await delay(1200);
  const abhijitRaw   = await apiCall("abhijit-muhurat",     chart); await delay(1200);
  const amritRaw     = await apiCall("amrit-kaal",          chart); await delay(1200);
  const durRaw       = await apiCall("dur-muhurat",         chart); await delay(1200);
  const varjyamRaw   = await apiCall("varjyam",             chart);

  // ── PARSE KARANA ─────────────────────────────
  const karanaObj  = parseOutput(karanaRaw);
  const karanaItem = findActive(karanaObj);
  const karanaName = karanaItem?.name || '--';
  const karanaEnd  = fmt(karanaItem?.completion);

  // ── PARSE YOGA ───────────────────────────────
  const yogaObj  = parseOutput(yogaRaw);
  const yogaItem = findActive(yogaObj);
  const yogaName = yogaItem?.name || '--';
  const yogaEnd  = fmt(yogaItem?.completion);

  // ── PARSE TITHI ──────────────────────────────
  const tithiObj  = parseOutput(tithiRaw);
  const tithiItem = findActive(tithiObj);
  const tithiName   = tithiItem?.name   || '--';
  const tithiEnd    = fmt(tithiItem?.completion);
  const tithiNumber = tithiItem?.number || 0;

  // ── PARSE NAKSHATRA ──────────────────────────
  const nakshatraObj  = parseOutput(nakshatraRaw);
  const nakshatraItem = findActive(nakshatraObj);
  const nakshatraName = nakshatraItem?.name || '--';
  const nakshatraEnd  = fmt(nakshatraItem?.completion);

  // ── PARSE WEEKDAY ────────────────────────────
  const weekdayObj = parseOutput(weekdayRaw);
  const weekday    = weekdayObj?.name
    || weekdayObj?.weekday_name
    || new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // ── PARSE SUNRISE/SUNSET ─────────────────────
  const sunObj  = parseOutput(sunRaw);
  const sunrise = fmt(sunObj?.sunrise || sunObj?.sun_rise);
  const sunset  = fmt(sunObj?.sunset  || sunObj?.sun_set);

  // ── PARSE RAHU KALAM ─────────────────────────
  const rahuObj  = parseOutput(rahuRaw) || rahuRaw;
  const rahuTime = fmtRange(
    rahuObj?.start || rahuObj?.start_time,
    rahuObj?.end   || rahuObj?.end_time
  );

  // ── PARSE GULIKA ─────────────────────────────
  const gulikaObj  = parseOutput(gulikaRaw) || gulikaRaw;
  const gulikaTime = fmtRange(
    gulikaObj?.start || gulikaObj?.start_time,
    gulikaObj?.end   || gulikaObj?.end_time
  );

  // ── PARSE YAMAGANDA ──────────────────────────
  const yamaObj  = parseOutput(yamaRaw) || yamaRaw;
  const yamaTime = fmtRange(
    yamaObj?.start || yamaObj?.start_time,
    yamaObj?.end   || yamaObj?.end_time
  );

  // ── PARSE ABHIJIT ────────────────────────────
  const abhijitObj  = parseOutput(abhijitRaw) || abhijitRaw;
  const abhijitTime = fmtRange(
    abhijitObj?.start || abhijitObj?.start_time,
    abhijitObj?.end   || abhijitObj?.end_time
  );

  // ── PARSE AMRIT KAAL ─────────────────────────
  const amritObj  = parseOutput(amritRaw) || amritRaw;
  const amritTime = fmtRange(
    amritObj?.start || amritObj?.start_time,
    amritObj?.end   || amritObj?.end_time
  );

  // ── PARSE DUR MUHURAT ─────────────────────────
  const durObj = parseOutput(durRaw) || durRaw;
  let durTime  = '--';
  if (Array.isArray(durObj)) {
    durTime = durObj.map(d => fmtRange(
      d.start || d.start_time,
      d.end   || d.end_time
    )).join(' · ');
  } else if (durObj?.start || durObj?.start_time) {
    durTime = fmtRange(
      durObj.start || durObj.start_time,
      durObj.end   || durObj.end_time
    );
  }

  // ── PARSE VARJYAM ────────────────────────────
  const varjyamObj  = parseOutput(varjyamRaw) || varjyamRaw;
  const varjyamTime = fmtRange(
    varjyamObj?.start || varjyamObj?.start_time,
    varjyamObj?.end   || varjyamObj?.end_time
  );

  // ── RETURN UNIFIED DATA ───────────────────────
  const result = {
    karanaName,    karanaEnd,
    yogaName,      yogaEnd,
    tithiName,     tithiEnd,    tithiNumber,
    nakshatraName, nakshatraEnd,
    weekday,       sunrise,     sunset,
    rahuTime,      gulikaTime,  yamaTime,
    abhijitTime,   amritTime,
    durTime,       varjyamTime
  };

  console.log("🌊 JyotishFlow v8 final data:", result);
  return result;
}