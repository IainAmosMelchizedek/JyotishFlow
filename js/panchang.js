/* ============================================
   JYOTISHFLOW — PANCHANG.JS — VEDIKA API v7
   Using correct individual structured endpoints
   ============================================ */

const USE_SANDBOX = false;
const BASE = USE_SANDBOX
  ? "https://corsproxy.io/?" + encodeURIComponent("https://api.vedika.io/sandbox")
  : "https://corsproxy.io/?" + encodeURIComponent("https://api.vedika.io");

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

function fmtRange(start, end) {
  if (!start || !end) return '--';
  return `${fmt(start)} — ${fmt(end)}`;
}

// ── SINGLE ENDPOINT CALL ────────────────────────
async function call(endpoint, chart) {
  const now     = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const lat     = chart.latitude;
  const lon     = chart.longitude;

  const sandboxUrl = `https://api.vedika.io/sandbox${endpoint}?date=${dateStr}&lat=${lat}&lon=${lon}`;
  const liveUrl    = `https://api.vedika.io${endpoint}?date=${dateStr}&lat=${lat}&lon=${lon}`;

  const targetUrl = USE_SANDBOX ? sandboxUrl : liveUrl;
  const proxyUrl  = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

  try {
    const res = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(USE_SANDBOX ? {} : { "Authorization": `Bearer ${chart.apiKey}` })
      }
    });

    if (!res.ok) {
      console.warn(`❌ ${endpoint} failed: ${res.status}`);
      return null;
    }

    const json = await res.json();
    console.log(`✅ ${endpoint}:`, json.data);
    return json.data || null;

  } catch(e) {
    console.warn(`❌ ${endpoint} error:`, e.message);
    return null;
  }
}

// ── DELAY HELPER ────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── MAIN LOAD FUNCTION ──────────────────────────
async function loadPanchang(chart) {
  console.log("🌊 JyotishFlow v7: Loading via Vedika structured endpoints...");
  console.log("USE_SANDBOX:", USE_SANDBOX);

  // Sequential calls with small delay
  const tithiData    = await call("/astrology/tithi",          chart);
  await delay(300);
  const nakshatraData= await call("/astrology/nakshatra",      chart);
  await delay(300);
  const yogaData     = await call("/astrology/yoga",           chart);
  await delay(300);
  const karanaData   = await call("/astrology/karana",         chart);
  await delay(300);
  const panchaData   = await call("/panchang/today",           chart);
  await delay(300);
  const rahuData     = await call("/astrology/rahu-kaal",      chart);
  await delay(300);
  const gulikaData   = await call("/astrology/gulika-kaal",    chart);
  await delay(300);
  const yamaData     = await call("/astrology/yamaghanta",     chart);
  await delay(300);
  const abhijitData  = await call("/astrology/abhijit-muhurta",chart);
  await delay(300);
  const durData      = await call("/astrology/durmuhurta",     chart);
  await delay(300);
  const auspData     = await call("/astrology/auspicious-period", chart);

  console.log("Raw panchang today:", panchaData);

  // ── PARSE TITHI ──────────────────────────────
  const tithiName   = tithiData?.tithi?.name    || panchaData?.tithi?.name    || '--';
  const tithiEnd    = fmt(tithiData?.tithi?.end_time || panchaData?.tithi?.end_time);
  const tithiNumber = parseTithiNumber(tithiName);

  // ── PARSE NAKSHATRA ──────────────────────────
  const nakshatraName = nakshatraData?.nakshatra?.name || panchaData?.nakshatra?.name || '--';
  const nakshatraEnd  = fmt(nakshatraData?.nakshatra?.end_time || panchaData?.nakshatra?.end_time);

  // ── PARSE YOGA ───────────────────────────────
  const yogaName = yogaData?.yoga?.name || panchaData?.yoga?.name || '--';
  const yogaEnd  = fmt(yogaData?.yoga?.end_time || panchaData?.yoga?.end_time);

  // ── PARSE KARANA ─────────────────────────────
  const karanaName = karanaData?.karana?.name || panchaData?.karana?.name || '--';
  const karanaEnd  = fmt(karanaData?.karana?.end_time || panchaData?.karana?.end_time);

  // ── PARSE WEEKDAY ────────────────────────────
  const weekday = panchaData?.vara?.name
    ? vedicToEnglishDay(panchaData.vara.name)
    : new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // ── PARSE SUNRISE/SUNSET ─────────────────────
  const sunrise = fmt(panchaData?.sunrise);
  const sunset  = fmt(panchaData?.sunset);

  // ── PARSE TIME WINDOWS ────────────────────────
  const rahuTime    = fmtRange(rahuData?.rahu_kaal?.start    || rahuData?.start,
                               rahuData?.rahu_kaal?.end      || rahuData?.end);
  const gulikaTime  = fmtRange(gulikaData?.gulika_kaal?.start || gulikaData?.start,
                               gulikaData?.gulika_kaal?.end   || gulikaData?.end);
  const yamaTime    = fmtRange(yamaData?.yamaghanta?.start   || yamaData?.start,
                               yamaData?.yamaghanta?.end     || yamaData?.end);
  const abhijitTime = fmtRange(abhijitData?.abhijit_muhurta?.start || abhijitData?.start,
                               abhijitData?.abhijit_muhurta?.end   || abhijitData?.end);

  // Amrit Kalam from auspicious periods
  const amritEntry  = Array.isArray(auspData)
    ? auspData.find(t => t.name?.toLowerCase().includes('amrit'))
    : null;
  const amritTime   = amritEntry
    ? fmtRange(amritEntry.start, amritEntry.end)
    : fmt(panchaData?.auspicious_timings?.find(t => t.name?.toLowerCase().includes('amrit'))?.start);

  // Dur Muhurtam
  let durTime = '--';
  if (Array.isArray(durData)) {
    durTime = durData.map(d => fmtRange(d.start, d.end)).join(' · ');
  } else if (durData?.start) {
    durTime = fmtRange(durData.start, durData.end);
  }

  // Varjyam from panchang
  const varjEntry   = (panchaData?.inauspicious_periods || [])
    .find(t => t.name?.toLowerCase().includes('varj'));
  const varjyamTime = varjEntry
    ? fmtRange(varjEntry.start, varjEntry.end)
    : '--';

  const result = {
    karanaName,    karanaEnd,
    yogaName,      yogaEnd,
    tithiName,     tithiEnd,    tithiNumber,
    nakshatraName, nakshatraEnd,
    weekday,       sunrise,     sunset,
    rahuTime,      gulikaTime,  yamaTime,
    abhijitTime,   amritTime:   amritTime || '--',
    durTime,       varjyamTime
  };

  console.log("🌊 JyotishFlow v7 final data:", result);
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