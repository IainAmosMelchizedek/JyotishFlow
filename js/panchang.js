/* ============================================
   JYOTISHFLOW — PANCHANG.JS — VEDIKA API v6
   Using correct /api/v1/astrology/query endpoint
   ============================================ */

const VEDIKA_URL = "https://corsproxy.io/?" + encodeURIComponent("https://api.vedika.io/api/v1/astrology/query");

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
  console.log("🌊 JyotishFlow v6: Calling Vedika AI query endpoint...");

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric',
    month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const question = `Give me today's complete Panchang for Boston MA USA for ${dateStr} at ${timeStr} Eastern Time. Include: Tithi name and end time, Nakshatra name and end time, Yoga name and end time, Karana name and end time, Vara/Weekday name, Sunrise time, Sunset time, Rahu Kalam start and end, Gulika Kalam start and end, Yamaganda start and end, Abhijit Muhurta start and end, Amrit Kalam start and end, Dur Muhurtam start and end, Varjyam start and end. Respond ONLY in JSON format with no extra text, no markdown, no backticks. Use this exact structure: {"tithi":{"name":"","end_time":""},"nakshatra":{"name":"","end_time":""},"yoga":{"name":"","end_time":""},"karana":{"name":"","end_time":""},"weekday":"","sunrise":"","sunset":"","rahukaal":{"start":"","end":""},"gulika":{"start":"","end":""},"yamagandam":{"start":"","end":""},"abhijit_muhurta":{"start":"","end":""},"amrit_kalam":{"start":"","end":""},"dur_muhurtam":[{"start":"","end":""}],"varjyam":{"start":"","end":""}}`;

  let raw;
  try {
    const res = await fetch(VEDIKA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${chart.apiKey}`
      },
      body: JSON.stringify({
        question: question,
        birthDetails: {
          datetime:  "1980-10-15T09:46:00",
          latitude:  chart.latitude,
          longitude: chart.longitude,
          timezone:  "-05:00"
        },
        responseFormat: "json"
      })
    });

    if (!res.ok) {
      throw new Error(`Vedika API error: ${res.status}`);
    }

    const json = await res.json();
    console.log("✅ Vedika raw response:", json);

    // Parse the structured JSON response
    let parsed;
    if (json.structuredResponse) {
      parsed = json.structuredResponse;
    } else if (json.response) {
      try {
        const clean = json.response.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch(e) {
        console.warn("Could not parse response as JSON:", json.response);
        parsed = {};
      }
    } else {
      parsed = json.data || json;
    }

    console.log("✅ Parsed panchang:", parsed);
    raw = parsed;

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

  const weekday = raw.weekday
    ? vedicToEnglishDay(raw.weekday)
    : now.toLocaleDateString('en-US', { weekday: 'long' });

  const sunrise = fmt(raw.sunrise);
  const sunset  = fmt(raw.sunset);

  const rahuTime    = fmtRange(raw.rahukaal?.start,       raw.rahukaal?.end);
  const gulikaTime  = fmtRange(raw.gulika?.start,         raw.gulika?.end);
  const yamaTime    = fmtRange(raw.yamagandam?.start,     raw.yamagandam?.end);
  const abhijitTime = fmtRange(raw.abhijit_muhurta?.start,raw.abhijit_muhurta?.end);
  const amritTime   = fmtRange(raw.amrit_kalam?.start,    raw.amrit_kalam?.end);
  const varjyamTime = fmtRange(raw.varjyam?.start,        raw.varjyam?.end);

  let durTime = '--';
  if (Array.isArray(raw.dur_muhurtam) && raw.dur_muhurtam.length > 0) {
    durTime = raw.dur_muhurtam.map(d => fmtRange(d.start, d.end)).join(' · ');
  } else if (raw.dur_muhurtam?.start) {
    durTime = fmtRange(raw.dur_muhurtam.start, raw.dur_muhurtam.end);
  }

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
    'Pratipada':1,  'Dwitiya':2,     'Tritiya':3,
    'Chaturthi':4,  'Panchami':5,    'Shashthi':6,
    'Saptami':7,    'Ashtami':8,     'Navami':9,
    'Dashami':10,   'Ekadashi':11,   'Dwadashi':12,
    'Trayodashi':13,'Chaturdashi':14,'Purnima':15,
    'Amavasya':30
  };
  for (const [key, val] of Object.entries(map)) {
    if (name?.includes(key)) return val;
  }
  return 0;
}

// ── VEDIC DAY CONVERTER ──────────────────────────
function vedicToEnglishDay(name) {
  const map = {
    'Ravivara':'Sunday',    'Somavara':'Monday',
    'Mangalvara':'Tuesday', 'Budhvara':'Wednesday',
    'Guruvara':'Thursday',  'Shukravara':'Friday',
    'Shanivara':'Saturday', 'Monday':'Monday',
    'Tuesday':'Tuesday',    'Wednesday':'Wednesday',
    'Thursday':'Thursday',  'Friday':'Friday',
    'Saturday':'Saturday',  'Sunday':'Sunday'
  };
  return map[name] || name;
}