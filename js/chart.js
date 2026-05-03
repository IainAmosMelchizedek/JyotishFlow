/* ============================================
   JYOTISHFLOW — CHART.JS — BIRTH CHART DATA
   ============================================ */

// This file holds your personal birth chart
// constants and any future chart calculations

// ── VIMSHOTTARI DASHA PERIODS ──────────────────
const DASHA_PERIODS = [
  { planet: "Ketu",    start: "1980-10-15", end: "1982-06-20" },
  { planet: "Venus",   start: "1982-06-20", end: "2002-06-20" },
  { planet: "Sun",     start: "2002-06-20", end: "2008-06-20" },
  { planet: "Moon",    start: "2008-06-20", end: "2018-06-20" },
  { planet: "Mars",    start: "2018-06-20", end: "2025-06-20" },
  { planet: "Rahu",    start: "2025-06-20", end: "2043-06-20" },
  { planet: "Jupiter", start: "2043-06-20", end: "2059-06-20" },
  { planet: "Saturn",  start: "2059-06-20", end: "2078-06-20" },
  { planet: "Mercury", start: "2078-06-20", end: "2095-06-20" }
];

// ── RAHU MAHADASHA ANTARDASHA ──────────────────
const RAHU_ANTARDASHA = [
  { planet: "Rahu",    end: "2028-03-02" },
  { planet: "Jupiter", end: "2030-07-26" },
  { planet: "Saturn",  end: "2033-06-02" },
  { planet: "Mercury", end: "2035-12-20" },
  { planet: "Ketu",    end: "2037-01-08" },
  { planet: "Venus",   end: "2040-01-08" },
  { planet: "Sun",     end: "2040-12-02" },
  { planet: "Moon",    end: "2042-06-02" },
  { planet: "Mars",    end: "2043-06-20" }
];

// ── GET CURRENT ANTARDASHA ──────────────────────
function getCurrentAntardasha() {
  const now = new Date();
  for (const period of RAHU_ANTARDASHA) {
    if (now < new Date(period.end)) {
      return period.planet;
    }
  }
  return "Mars";
}

// ── GET CURRENT MAHADASHA ───────────────────────
function getCurrentMahadasha() {
  const now = new Date();
  for (const period of DASHA_PERIODS) {
    if (now >= new Date(period.start) && now < new Date(period.end)) {
      return period.planet;
    }
  }
  return "Rahu";
}

// ── DAYS REMAINING IN RAHU MAHADASHA ───────────
function getDaysRemaining() {
  const end  = new Date("2043-06-20");
  const now  = new Date();
  const diff = end - now;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ── UPDATE DASHA DISPLAY ────────────────────────
function updateDashaDisplay() {
  const mahadasha   = getCurrentMahadasha();
  const antardasha  = getCurrentAntardasha();
  const daysLeft    = getDaysRemaining();

  // Update the anchor card for dasha
  const dashaCard = document.querySelector('.anchor-card.neutral .anchor-value');
  if (dashaCard) {
    dashaCard.textContent = `${mahadasha} MAHADASHA`;
  }

  const dashaNote = document.querySelector('.anchor-card.neutral .anchor-note');
  if (dashaNote) {
    dashaNote.textContent = `Antardasha: ${antardasha} · ${daysLeft.toLocaleString()} days remaining`;
  }
}

// ── PLANETARY HOUR CALCULATOR ───────────────────
// Planetary hours follow the Chaldean order
const CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const DAY_RULERS = {
  "Sunday":    "Sun",
  "Monday":    "Moon",
  "Tuesday":   "Mars",
  "Wednesday": "Mercury",
  "Thursday":  "Jupiter",
  "Friday":    "Venus",
  "Saturday":  "Saturn"
};

function getPlanetaryHour(sunrise, sunset) {
  try {
    const now     = new Date();
    const today   = now.toDateString();
    const srDate  = new Date(`${today} ${sunrise}`);
    const ssDate  = new Date(`${today} ${sunset}`);

    if (isNaN(srDate) || isNaN(ssDate)) return null;

    const dayLength  = ssDate - srDate;
    const hourLength = dayLength / 12;
    const elapsed    = now - srDate;

    if (elapsed < 0 || elapsed > dayLength) return null;

    const hourIndex  = Math.floor(elapsed / hourLength);
    const dayName    = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayRuler   = DAY_RULERS[dayName] || "Sun";
    const startIndex = CHALDEAN_ORDER.indexOf(dayRuler);
    const planet     = CHALDEAN_ORDER[(startIndex + hourIndex) % 7];

    return { planet, hourIndex: hourIndex + 1 };
  } catch (e) {
    return null;
  }
}

// ── INIT CHART MODULE ───────────────────────────
function initChart() {
  updateDashaDisplay();
}

document.addEventListener('DOMContentLoaded', initChart);