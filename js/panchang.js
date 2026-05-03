/* ============================================
   JYOTISHFLOW — PANCHANG.JS — API ENGINE
   ============================================ */

// ── API CONFIGURATION ───────────────────────────
const API_BASE = "https://json.freeastrologyapi.com";

// ── HELPER: BUILD REQUEST ───────────────────────
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

// ── HELPER: API CALL ────────────────────────────
async function apiCall(endpoint, chart) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key":    chart.apiKey
    },
    body: JSON.stringify(buildBody(chart))
  });

  if (!response.ok) {
    throw new Error(`API error on ${endpoint}: ${response.status}`);
  }

  return response.json();
}

// ── HELPER: FORMAT TIME ─────────────────────────
function fmt(timeStr) {
  if (!timeStr) return '--';
  return timeStr;
}

// ── HELPER: EXTRACT NAME SAFELY ─────────────────
function getName(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined) return obj[key];
  }
  return '--';
}

// ── MAIN LOAD FUNCTION ──────────────────────────
async function loadPanchang(chart) {

  console.log("🌊 JyotishFlow: Loading cosmic data...");

  // Fire all API calls in parallel for speed
  const [
    pancRes,
    rahuRes,
    gulikaRes,
    yamaRes,
    abhijitRes,
    amritRes,
    durRes,
    varjyamRes,
    sunRes
  ] = await Promise.allSettled([
    apiCall("complete-panchang",  chart),
    apiCall("rahu-kalam",         chart),
    apiCall("gulika-kalam",       chart),
    apiCall("yama-gandam",        chart),
    apiCall("abhijit-muhurat",    chart),
    apiCall("amrit-kaal",         chart),
    apiCall("dur-muhurat",        chart),
    apiCall("varjyam",            chart),
    apiCall("getsunriseandsunset",chart)
  ]);

  // ── PARSE COMPLETE PANCHANG ─────────────────
  const panc = pancRes.status === 'fulfilled' ? pancRes.value : {};
  console.log("Panchang raw:", panc);

  // Karana
  const karanaObj  = panc.karana   || {};
  const karanaName = getName(karanaObj, 'name', 'karana_name') || '--';
  const karanaEnd  = fmt(getName(karanaObj, 'end_time', 'upto'));

  // Yoga
  const yogaObj    = panc.yoga     || {};
  const yogaName   = getName(yogaObj, 'name', 'yoga_name') || '--';
  const yogaEnd    = fmt(getName(yogaObj, 'end_time', 'upto'));

  // Tithi
  const tithiObj   = panc.tithi    || {};
  const tithiName  = getName(tithiObj, 'name', 'tithi_name') || '--';
  const tithiEnd   = fmt(getName(tithiObj, 'end_time', 'upto'));
  const tithiNum   = tithiObj.number || tithiObj.tithi_number || 0;

  // Nakshatra
  const nakshObj      = panc.nakshatra || {};
  const nakshatraName = getName(nakshObj, 'name', 'nakshatra_name') || '--';
  const nakshatraEnd  = fmt(getName(nakshObj, 'end_time', 'upto'));

  // Weekday
  const weekdayObj = panc.weekday || {};
  const weekday    = getName(weekdayObj, 'weekday_name', 'name') || '--';

  // ── PARSE RAHU KALAM ────────────────────────
  const rahu    = rahuRes.status === 'fulfilled' ? rahuRes.value : {};
  const rahuStart = getName(rahu, 'start', 'start_time');
  const rahuEnd2  = getName(rahu, 'end',   'end_time');
  const rahuTime  = (rahuStart && rahuEnd2) ? `${fmt(rahuStart)} — ${fmt(rahuEnd2)}` : '--';

  // ── PARSE GULIKA KALAM ──────────────────────
  const gulika   = gulikaRes.status === 'fulfilled' ? gulikaRes.value : {};
  const gulikaStart = getName(gulika, 'start', 'start_time');
  const gulikaEnd2  = getName(gulika, 'end',   'end_time');
  const gulikaTime  = (gulikaStart && gulikaEnd2) ? `${fmt(gulikaStart)} — ${fmt(gulikaEnd2)}` : '--';

  // ── PARSE YAMAGANDA ─────────────────────────
  const yama    = yamaRes.status === 'fulfilled' ? yamaRes.value : {};
  const yamaStart = getName(yama, 'start', 'start_time');
  const yamaEnd2  = getName(yama, 'end',   'end_time');
  const yamaTime  = (yamaStart && yamaEnd2) ? `${fmt(yamaStart)} — ${fmt(yamaEnd2)}` : '--';

  // ── PARSE ABHIJIT MUHURTA ───────────────────
  const abhijit  = abhijitRes.status === 'fulfilled' ? abhijitRes.value : {};
  const abhijitStart = getName(abhijit, 'start', 'start_time');
  const abhijitEnd2  = getName(abhijit, 'end',   'end_time');
  const abhijitTime  = (abhijitStart && abhijitEnd2) ? `${fmt(abhijitStart)} — ${fmt(abhijitEnd2)}` : '--';

  // ── PARSE AMRIT KAAL ────────────────────────
  const amrit   = amritRes.status === 'fulfilled' ? amritRes.value : {};
  const amritStart = getName(amrit, 'start', 'start_time');
  const amritEnd2  = getName(amrit, 'end',   'end_time');
  const amritTime  = (amritStart && amritEnd2) ? `${fmt(amritStart)} — ${fmt(amritEnd2)}` : '--';

  // ── PARSE DUR MUHURTA ───────────────────────
  const dur     = durRes.status === 'fulfilled' ? durRes.value : {};
  const durArr  = Array.isArray(dur) ? dur : (dur.dur_muhurat || []);
  const durTime = durArr.length > 0
    ? durArr.map(d => `${fmt(d.start || d.start_time)} — ${fmt(d.end || d.end_time)}`).join(' · ')
    : '--';

  // ── PARSE VARJYAM ───────────────────────────
  const varj     = varjyamRes.status === 'fulfilled' ? varjyamRes.value : {};
  const varjStart = getName(varj, 'start', 'start_time');
  const varjEnd2  = getName(varj, 'end',   'end_time');
  const varjyamTime = (varjStart && varjEnd2) ? `${fmt(varjStart)} — ${fmt(varjEnd2)}` : '--';

  // ── PARSE SUNRISE SUNSET ────────────────────
  const sun     = sunRes.status === 'fulfilled' ? sunRes.value : {};
  const sunrise = fmt(getName(sun, 'sunrise', 'sun_rise'));
  const sunset  = fmt(getName(sun, 'sunset',  'sun_set'));

  // ── RETURN UNIFIED DATA OBJECT ──────────────
  const result = {
    karanaName,
    karanaEnd,
    yogaName,
    yogaEnd,
    tithiName,
    tithiEnd,
    tithiNumber: tithiNum,
    nakshatraName,
    nakshatraEnd,
    weekday,
    rahuTime,
    gulikaTime,
    yamaTime,
    abhijitTime,
    amritTime,
    durTime,
    varjyamTime,
    sunrise,
    sunset
  };

  console.log("🌊 JyotishFlow data ready:", result);
  return result;
}