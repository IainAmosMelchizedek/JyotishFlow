/* ============================================
   JYOTISHFLOW — PANCHANG.JS — VEDIKA API v4
   Single call. All data. Fast. Clean.
   ============================================ */

const VEDIKA_SANDBOX = "https://corsproxy.io/?" + encodeURIComponent("https://api.vedika.io/sandbox/panchang/today");
const VEDIKA_LIVE    = "https://api.vedika.io/v2/astrology/panchang";

// ── FORMAT TIME ─────────────────────────────────
function fmt(val) {
  if (!val) return '--';
  // Convert 24hr to 12hr format
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
  console.log("🌊 JyotishFlow: Loading via Vedika single call...");

  // Use sandbox for now — swap to VEDIKA_LIVE when subscribed
 const useSandbox = false;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const liveUrl = `https://corsproxy.io/?${encodeURIComponent(VEDIKA_LIVE)}`;
  const sandboxUrl = `https://corsproxy.io/?${encodeURIComponent(VEDIKA_SANDBOX)}`;
  const url = useSandbox ? sandboxUrl : liveUrl;

  let raw;
  try {
    const res = await fetch(url, {
      method: useSandbox ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(useSandbox ? {} : { "Authorization": `Bearer ${chart.apiKey}` })
      },
      ...(useSandbox ? {} : {
        body: JSON.stringify({
          date:      dateStr,
          latitude:  chart.latitude,
          longitude: chart.longitude,
          timezone:  "America/New_York"
        })
      })
    });

    if (!res.ok) {
      throw new Error(`Vedika API error: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Vedika raw response:", json);
    // allorigins wraps the response in a contents string
   raw = json.data || json;

  } catch(e) {
    console.error("❌ Vedika API failed:", e.message);
    throw e;
  }

  // ── PARSE ALL DATA FROM SINGLE RESPONSE ────────

  // Tithi
  const tithiName   = raw.tithi?.name   || '--';
  const tithiEnd    = fmt(raw.tithi?.end_time);
  const tithiNumber = parseTithiNumber(tithiName);

  // Nakshatra
  const nakshatraName = raw.nakshatra?.name     || '--';
  const nakshatraEnd  = fmt(raw.nakshatra?.end_time);

  // Yoga
  const yogaName = raw.yoga?.name     || '--';
  const yogaEnd  = fmt(raw.yoga?.end_time);

  // Karana
  const karanaName = raw.karana?.name     || '--';
  const karanaEnd  = fmt(raw.karana?.end_time);

  // Weekday
  const weekday = raw.vara?.name
    ? vedicToEnglishDay(raw.vara.name)
    : new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Sunrise / Sunset
  const sunrise = fmt(raw.sunrise);
  const sunset  = fmt(raw.sunset);

  // Rahu Kaal
  const rahuTime = fmtRange(raw.rahukaal?.start, raw.rahukaal?.end);

  // Gulika
  const gulikaTime = fmtRange(raw.gulika?.start, raw.gulika?.end);

  // Yamaganda
  const yamaTime = fmtRange(raw.yamagandam?.start, raw.yamagandam?.end);

  // Abhijit Muhurta
  const abhijitTime = fmtRange(
    raw.abhijit_muhurta?.start,
    raw.abhijit_muhurta?.end
  );

  // Amrit Kalam — from auspicious_timings array
  const amritEntry = (raw.auspicious_timings || [])
    .find(t => t.name?.toLowerCase().includes('amrit'));
  const amritTime = amritEntry
    ? fmtRange(amritEntry.start, amritEntry.end)
    : 'Available with live API';

  // Dur Muhurtam — from inauspicious_periods array
  const durEntries = (raw.inauspicious_periods || [])
    .filter(t => t.name?.toLowerCase().includes('dur'));
  const durTime = durEntries.length > 0
    ? durEntries.map(d => fmtRange(d.start, d.end)).join(' · ')
    : 'Available with live API';

  // Varjyam — from inauspicious_periods array
  const varjEntry = (raw.inauspicious_periods || [])
    .find(t => t.name?.toLowerCase().includes('varj'));
  const varjyamTime = varjEntry
    ? fmtRange(varjEntry.start, varjEntry.end)
    : 'Available with live API';

  // ── RETURN UNIFIED DATA ─────────────────────────
  const result = {
    karanaName,    karanaEnd,
    yogaName,      yogaEnd,
    tithiName,     tithiEnd,    tithiNumber,
    nakshatraName, nakshatraEnd,
    weekday,
    sunrise,       sunset,
    rahuTime,      gulikaTime,  yamaTime,
    abhijitTime,   amritTime,
    durTime,       varjyamTime
  };

  console.log("🌊 JyotishFlow final data:", result);
  return result;
}

// ── TITHI NUMBER PARSER ──────────────────────────
function parseTithiNumber(name) {
  const tithiMap = {
    'Pratipada': 1,  'Dwitiya': 2,   'Tritiya': 3,
    'Chaturthi': 4,  'Panchami': 5,  'Shashthi': 6,
    'Saptami': 7,    'Ashtami': 8,   'Navami': 9,
    'Dashami': 10,   'Ekadashi': 11, 'Dwadashi': 12,
    'Trayodashi': 13,'Chaturdashi': 14,'Purnima': 15,
    'Amavasya': 30
  };
  for (const [key, val] of Object.entries(tithiMap)) {
    if (name?.includes(key)) return val;
  }
  return 0;
}

// ── VEDIC DAY NAME CONVERTER ─────────────────────
function vedicToEnglishDay(vedicName) {
  const map = {
    'Ravivara':  'Sunday',
    'Somavara':  'Monday',
    'Mangalvara':'Tuesday',
    'Budhvara':  'Wednesday',
    'Guruvara':  'Thursday',
    'Shukravara':'Friday',
    'Shanivara': 'Saturday'
  };
  return map[vedicName] || vedicName;
}