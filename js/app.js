/* ============================================
   JYOTISHFLOW — APP.JS — MAIN ENGINE
   ============================================ */

// ── BIRTH CHART PERSONAL DATA ──────────────────
const CHART = {
  name:        "CK Iain Melchizedek",
  location:    "Boston, MA",
  latitude:    42.3601,
  longitude:  -71.0589,
  timezone:   -4.0,

  // GHATAK — Personal Malefics
  badDay:       "Friday",
  badKarana:    "Taitila",
  badYoga:      "Vaidhriti",
  badNakshatra: "Bharani",
  badMonth:     "Shravan",
  badTithi:     [3, 8, 13],
  badPrahar:    1,
  badPlanets:   ["Venus", "Mercury"],

  // FAVORABLE
  luckyDays:    ["Tuesday", "Sunday"],
  goodPlanets:  ["Mars", "Moon", "Sun"],
  luckyNumbers: [1, 3, 7, 9],
  goodLagna:    ["Leo", "Scorpio", "Capricorn", "Pisces"],
  friendlySigns:["Aries", "Leo", "Scorpio"],
  luckyMetal:   "Gold",
  luckyStone:   "Yellow Sapphire",

  // DASHA
  mahadasha:    "Rahu",
  dashaStart:   "June 20, 2025",
  dashaEnd:     "June 20, 2043",

  // API KEY — replace with your actual key
  apiKey:       "vk_live_02a8b95531ad8e0b94ac8b11555b6458"
};

// ── KNOWN INAUSPICIOUS KARANAS ──────────────────
const BAD_KARANAS = ["Taitila", "Vishti", "Shakuni", "Chatushpada", "Naga", "Kimstughna"];
const BAD_YOGAS   = ["Vaidhriti", "Vyatipata"];

// ── LIVE CLOCK ──────────────────────────────────
function startClock() {
  function update() {
    const now  = new Date();
    const h    = String(now.getHours()).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    const s    = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('liveClock').textContent = `${h}:${m}:${s}`;
  }
  update();
  setInterval(update, 1000);
}

// ── OCEAN PARTICLE CANVAS ───────────────────────
function startOcean() {
  const canvas = document.getElementById('ocean');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.5 + 0.3,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.15,
      alpha:  Math.random() * 0.5 + 0.1,
      color:  Math.random() > 0.5 ? '201,168,76' : '0,212,255'
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 180 }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0 || p.x > W) p.speedX *= -1;
      if (p.y < 0 || p.y > H) p.speedY *= -1;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
}

// ── ANIME.JS ENTRANCE ANIMATIONS ───────────────
function runAnimations() {
  // Header slams in
  anime({
    targets: 'header',
    translateY: [-60, 0],
    opacity:    [0, 1],
    duration:   1000,
    easing:     'easeOutExpo'
  });

  // Banner surges up
  anime({
    targets: '.day-banner',
    translateY: [40, 0],
    opacity:    [0, 1],
    duration:   900,
    delay:      200,
    easing:     'easeOutExpo'
  });

  // Cards crash in like waves
  anime({
    targets: '.card',
    translateY: [60, 0],
    opacity:    [0, 1],
    duration:   700,
    delay:      anime.stagger(100, { start: 400 }),
    easing:     'easeOutBack'
  });

  // Timeline slides in from left
  anime({
    targets: '.tl-item',
    translateX: [-80, 0],
    opacity:    [0, 1],
    duration:   600,
    delay:      anime.stagger(80, { start: 600 }),
    easing:     'easeOutExpo'
  });

  // Anchor cards pop in
  anime({
    targets: '.anchor-card',
    scale:    [0.8, 1],
    opacity:  [0, 1],
    duration: 500,
    delay:    anime.stagger(60, { start: 800 }),
    easing:   'easeOutBack'
  });

  // Sun moon bar rises
  anime({
    targets: '.sun-moon-bar',
    translateY: [30, 0],
    opacity:    [0, 1],
    duration:   700,
    delay:      1000,
    easing:     'easeOutExpo'
  });

  // Gold pulse on banner score
  anime({
    targets: '.banner-score',
    color:    ['#c9a84c', '#ffd700', '#c9a84c'],
    duration: 2000,
    loop:     true,
    easing:   'easeInOutSine'
  });
}

// ── CHECK IF TIME IS CURRENTLY ACTIVE ──────────
function isActiveNow(startStr, endStr) {
  if (!startStr || !endStr) return false;
  const now   = new Date();
  const today = now.toDateString();

  function parse(str) {
    const d = new Date(`${today} ${str}`);
    return isNaN(d) ? null : d;
  }

  const start = parse(startStr);
  const end   = parse(endStr);
  if (!start || !end) return false;
  return now >= start && now <= end;
}

// ── EVALUATE KARANA ─────────────────────────────
function evaluateKarana(name) {
  if (name === CHART.badKarana)    return { status: 'bad',     label: '⚠️ YOUR BAD KARANA' };
  if (BAD_KARANAS.includes(name))  return { status: 'bad',     label: '⚠️ INAUSPICIOUS' };
  return                                   { status: 'good',    label: '✅ AUSPICIOUS' };
}

// ── EVALUATE YOGA ───────────────────────────────
function evaluateYoga(name) {
  if (name === CHART.badYoga)      return { status: 'bad',     label: '⚠️ YOUR BAD YOGA' };
  if (BAD_YOGAS.includes(name))    return { status: 'bad',     label: '⚠️ INAUSPICIOUS' };
  return                                   { status: 'good',    label: '✅ AUSPICIOUS' };
}

// ── EVALUATE TITHI ──────────────────────────────
function evaluateTithi(number) {
  if (CHART.badTithi.includes(number)) return { status: 'bad',  label: '⚠️ YOUR BAD TITHI' };
  return                                       { status: 'good', label: '✅ AUSPICIOUS' };
}

// ── EVALUATE NAKSHATRA ──────────────────────────
function evaluateNakshatra(name) {
  if (name === CHART.badNakshatra) return { status: 'bad',  label: '⚠️ YOUR BAD NAKSHATRA' };
  return                                   { status: 'good', label: '✅ AUSPICIOUS' };
}

// ── EVALUATE WEEKDAY ────────────────────────────
function evaluateDay(dayName) {
  if (dayName === CHART.badDay)          return 'bad';
  if (CHART.luckyDays.includes(dayName)) return 'good';
  return 'neutral';
}

// ── COMPUTE OVERALL DAY SCORE ───────────────────
function computeDayScore(data) {
  let score = 100;
  let flags = [];

  const dayStatus = evaluateDay(data.weekday);
  if (dayStatus === 'bad')  { score -= 30; flags.push('BAD DAY'); }
  if (dayStatus === 'good') { score += 10; }

  const karanaEval = evaluateKarana(data.karanaName);
  if (karanaEval.status === 'bad') { score -= 25; flags.push('BAD KARANA'); }

  const yogaEval = evaluateYoga(data.yogaName);
  if (yogaEval.status === 'bad') { score -= 20; flags.push('BAD YOGA'); }

  const tithiEval = evaluateTithi(data.tithiNumber);
  if (tithiEval.status === 'bad') { score -= 15; flags.push('BAD TITHI'); }

  const nakshatraEval = evaluateNakshatra(data.nakshatraName);
  if (nakshatraEval.status === 'bad') { score -= 15; flags.push('BAD NAKSHATRA'); }

  score = Math.max(0, Math.min(100, score));
  return { score, flags };
}

// ── SET BANNER STATUS ───────────────────────────
function setBanner(score, flags) {
  const title = document.getElementById('bannerTitle');
  const sub   = document.getElementById('bannerSub');
  const icon  = document.getElementById('bannerIcon');
  const sc    = document.getElementById('bannerScore');
  const banner = document.querySelector('.day-banner');

  sc.textContent = score;

  if (score >= 80) {
    icon.textContent  = '🌊';
    title.textContent = 'FULL SAILS — RIDE THE TIDE';
    sub.textContent   = 'Your cosmic winds are strong today. Launch. Build. Conquer.';
    banner.style.borderColor = 'rgba(0,255,136,0.5)';
    sc.style.color    = 'var(--green-good)';
  } else if (score >= 55) {
    icon.textContent  = '⚓';
    title.textContent = 'STEADY WATERS — NAVIGATE WITH CARE';
    sub.textContent   = flags.length ? `Watch for: ${flags.join(' · ')}` : 'Mixed energies — choose your moments wisely.';
    banner.style.borderColor = 'rgba(201,168,76,0.5)';
    sc.style.color    = 'var(--gold)';
  } else {
    icon.textContent  = '🌩️';
    title.textContent = 'STORM WARNING — HOLD YOUR ANCHOR';
    sub.textContent   = flags.length ? `Active flags: ${flags.join(' · ')}` : 'Rough cosmic seas today. Avoid new beginnings.';
    banner.style.borderColor = 'rgba(255,34,51,0.5)';
    sc.style.color    = 'var(--red-bad)';
  }
}

// ── POPULATE CARDS ──────────────────────────────
function populateCards(data) {
  // KARANA
  const ke = evaluateKarana(data.karanaName);
  document.getElementById('karanaValue').textContent  = data.karanaName || '--';
  document.getElementById('karanaTime').textContent   = data.karanaEnd  || '';
  document.getElementById('karanaStatus').textContent = ke.label;
  document.getElementById('karanaStatus').className   = `card-status status-${ke.status}`;
  document.getElementById('cardKarana').className     = `card state-${ke.status}`;

  // YOGA
  const ye = evaluateYoga(data.yogaName);
  document.getElementById('yogaValue').textContent  = data.yogaName || '--';
  document.getElementById('yogaTime').textContent   = data.yogaEnd  || '';
  document.getElementById('yogaStatus').textContent = ye.label;
  document.getElementById('yogaStatus').className   = `card-status status-${ye.status}`;
  document.getElementById('cardYoga').className     = `card state-${ye.status}`;

  // TITHI
  const te = evaluateTithi(data.tithiNumber);
  document.getElementById('tithiValue').textContent  = data.tithiName   || '--';
  document.getElementById('tithiTime').textContent   = data.tithiEnd    || '';
  document.getElementById('tithiStatus').textContent = te.label;
  document.getElementById('tithiStatus').className   = `card-status status-${te.status}`;
  document.getElementById('cardTithi').className     = `card state-${te.status}`;

  // NAKSHATRA
  const ne = evaluateNakshatra(data.nakshatraName);
  document.getElementById('nakshatraValue').textContent  = data.nakshatraName || '--';
  document.getElementById('nakshatraTime').textContent   = data.nakshatraEnd  || '';
  document.getElementById('nakshatraStatus').textContent = ne.label;
  document.getElementById('nakshatraStatus').className   = `card-status status-${ne.status}`;
  document.getElementById('cardNakshatra').className     = `card state-${ne.status}`;
}

// ── POPULATE TIMELINE ───────────────────────────
function populateTimeline(data) {
  const fields = [
    { id: 'abhijitTime', val: data.abhijitTime },
    { id: 'amritTime',   val: data.amritTime   },
    { id: 'rahuTime',    val: data.rahuTime    },
    { id: 'gulikaTime',  val: data.gulikaTime  },
    { id: 'yamaTime',    val: data.yamaTime    },
    { id: 'durTime',     val: data.durTime     },
    { id: 'varjyamTime', val: data.varjyamTime },
  ];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) el.textContent = f.val || '--';
  });
}

// ── POPULATE SUN MOON BAR ───────────────────────
function populateSunMoon(data) {
  document.getElementById('sunriseVal').textContent  = data.sunrise  || '--';
  document.getElementById('sunsetVal').textContent   = data.sunset   || '--';
  document.getElementById('weekdayVal').textContent  = data.weekday  || '--';

  // Highlight lucky day
  const dayStatus = evaluateDay(data.weekday);
  const luckyNote = document.getElementById('luckyDayNote');
  if (dayStatus === 'good') {
    luckyNote.textContent = '🌟 TODAY IS YOUR POWER DAY!';
    luckyNote.style.color = 'var(--green-good)';
  } else if (dayStatus === 'bad') {
    luckyNote.textContent = '⚠️ FRIDAY — YOUR CHALLENGE DAY';
    luckyNote.style.color = 'var(--red-bad)';
  } else {
    luckyNote.textContent = 'Neutral day — flow steady';
    luckyNote.style.color = 'var(--neutral)';
  }
}

// ── SHOW DASHBOARD ──────────────────────────────
function showDashboard() {
  document.getElementById('loader').style.display    = 'none';
  document.getElementById('dashboard').classList.remove('hidden');
  runAnimations();
}

// ── MAIN INIT ───────────────────────────────────
async function init() {
  startClock();
  startOcean();

  try {
    // Load all panchang data
    const data = await loadPanchang(CHART);

    populateCards(data);
    populateTimeline(data);
    populateSunMoon(data);

    const { score, flags } = computeDayScore(data);
    setBanner(score, flags);

  } catch (err) {
    console.error('Panchang load error:', err);
    // Show dashboard anyway with fallback
    setBanner(50, ['API ERROR — CHECK CONSOLE']);
  }

  showDashboard();
}

document.addEventListener('DOMContentLoaded', init);