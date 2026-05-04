/* ============================================
   JYOTISHFLOW — PANCHANG.JS — VEDIKA API v5
   Single call. All data. Fast. Clean.
   ============================================ */

const VEDIKA_SANDBOX = "https://api.vedika.io/sandbox/panchang/today";
const VEDIKA_LIVE    = "https://api.vedika.io/v2/astrology/panchang";

// ── SET THIS TO false FOR LIVE DATA ─────────────
const USE_SANDBOX = false;

// ── FORMAT TIME ─────────────────────────────────
function fmt(val) {
  if (!val) return '--';
  try {
    const [h, m] = val.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
  } catch(e) {
    return val;
  }
}

// ── TIME RANGE FORMATTER ─────────────────────────
function fmtRange(start, end) {
  if (!start || !end) return '--';
  return `${fmt(start)} — ${fmt(end)}`;
}

// ── MAIN LOAD FUNCTION ──────────────────────────
async function loadPanchang(chart) {
  console.log("🌊 JyotishFlow v5: USE_SANDBOX =", USE_SANDBOX);

  const now     = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const url = USE_SANDBOX
    ? `https://corsproxy.io/?${encodeURIComponent(VEDIKA_SANDBOX)}`
    : `https://corsproxy.io/?${encodeURIComponent(VEDIKA_LIVE)}`;

  const method = USE_SANDBOX ? "GET" : "POST";

  const headers = {
    "Content-Type": "application/json",
    ...(USE_SANDBOX ? {} : { "Authorization": `Bearer ${chart.apiKey}` })
  };

  const body = USE_SANDBOX ? undefined : JSON.stringify({
    date:      dateStr,
    latitude:  chart.latitude,
    longitude: chart.longitude,
    timezone:  "America/New_York"
  });

  let raw;
  try {
    const res = await fetch(url, { method, headers, body });

    if (!res.ok) {
      throw new Error(`Vedika API error: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Vedika raw response:", json);
    raw = json.data || json;

  } catch(e) {
    console.error("❌ Vedika API failed:", e.message);
    throw e;
  }

  // ── PARSE ALL DATA ──────────────────────────────

  const tithiName   = raw.tithi?.name      || '--';
  const tithiEnd    = fmt(raw.tithi?.end_time);
  const tithiNumber = parseTithiNumber(tithiName);

  const nakshatraName = raw.nakshatra?.name    || '--';
  const nakshatraEnd  = fmt(raw.nakshatra?.end_time);

  const yogaName = raw.yoga?.name    || '--';
  const yogaEnd  = fmt(raw.yoga?.end_time);

  const karanaName = raw.karana?.name    || '--';
  const karanaEnd  = fmt(raw.karana?.end_time);

  const weekday = raw.vara?.name
    ? vedicToEnglishDay(raw.vara.name)
    : now.toLocaleDateString('en-US', { weekday: 'long' });

  const sunrise = fmt(raw.sunrise);
  const sunset  = fmt(raw.sunset);

  const rahuTime   = fmtRange(raw.rahukaal?.start,    raw.rahukaal?.end);
  const gulikaTime = fmtRange(raw.gulika?.start,      raw.gulika?.end);
  const yamaTime   = fmtRange(raw.yamagandam?.start,  raw.yamagandam?.end);
  const abhijitTime = fmtRange(raw.abhijit_muhurta?.start, raw.abhijit_muhurta?.end);

  const amritEntry  = (raw.auspicious_timings   || []).find(t => t.name?.toLowerCase().includes('amrit'));
  const amritTime   = amritEntry ? fmtRange(amritEntry.start,  amritEntry.end)  : 'Available with live API';

  const durEntries  = (raw.inauspicious_periods || []).filter(t => t.name?.toLowerCase().includes('dur'));
  const durTime     = durEntries.length > 0
    ? durEntries.map(d => fmtRange(d.start, d.end)).join(' · ')
    : 'Available with live API';

  const varjEntry   = (raw.inauspicious_periods || []).find(t => t.name?.toLowerCase().includes('varj'));
  const varjyamTime = varjEntry ? fmtRange(varjEntry.start, varjEntry.end) : 'Available with live API';

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

  console.log("🌊 JyotishFlow final data:", result);
  return result;
}

// ── TITHI NUMBER PARSER ──────────────────────────
function parseTithiNumber(name) {
  const map = {
    'Pratipada':1, 'Dwitiya':2,    'Tritiya':3,
    'Chaturthi':4, 'Panchami':5,   'Shashthi':6,
    'Saptami':7,   'Ashtami':8,    'Navami':9,
    'Dashami':10,  'Ekadashi':11,  'Dwadashi':12,
    'Trayodashi':13,'Chaturdashi':14,'Purnima':15,
    'Amavasya':30
  };
  for (const [key, val] of Object.entries(map)) {
    if (name?.includes(key)) return val;
  }
  return 0;
}

// ── VEDIC DAY CONVERTER ──────────────────────────
function vedicToEnglishDay(vedicName) {
  const map = {
    'Ravivara':'Sunday',   'Somavara':'Monday',
    'Mangalvara':'Tuesday','Budhvara':'Wednesday',
    'Guruvara':'Thursday', 'Shukravara':'Friday',
    'Shanivara':'Saturday'
  };
  return map[vedicName] || vedicName;
}