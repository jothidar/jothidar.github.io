// Jathagam + porutham engine. Port of the Python package `vedic` (same rules, same settings).
import SwissEph from './lib/swisseph-wasm/src/swisseph.js';
import { LOGO } from './logo-data.js';

// ---------------- settings schema: drives validation, defaults and the Settings screen
// type: select | number | bool | text | multi.  en/ta = labels, hint = optional help (English).
export const PORUTHAMS = ['dina', 'gana', 'mahendra', 'stree_deergha', 'yoni', 'rasi', 'rasyadhipati', 'vasya', 'rajju', 'vedha'];
export const SECTIONS = {
  calc: ['Calculation', 'கணிதம்'], dasa: ['Dasa', 'தசை'], chart: ['Charts', 'கட்டங்கள்'], tables: ['Report sections & tables', 'அறிக்கை பகுதிகள்'],
  match: ['Porutham rules', 'பொருத்த விதிகள்'], report: ['PDF, format & branding', 'PDF, வடிவம், அடையாளம்'], app: ['App', 'செயலி'],
};
const AYAN = ['lahiri', 'raman', 'krishnamurti', 'fagan_bradley', 'true_chitra', 'true_revati', 'true_pushya', 'true_mula', 'true_sheoran', 'ss_citra', 'ss_revati', 'yukteshwar', 'jn_bhasin', 'suryasiddhanta', 'suryasiddhanta_msun', 'aryabhata', 'aryabhata_522', 'deluce', 'ushashashi', 'j2000', 'galcent_0sag'];
export const SCHEMA = [
  { k: 'ayanamsa', sec: 'calc', type: 'select', def: 'lahiri', opts: AYAN, en: 'Ayanamsa', ta: 'அயனாம்சம்' },
  { k: 'ayanamsa_adjust', sec: 'calc', type: 'number', def: 0, min: -5, max: 5, step: 0.0001, en: 'Ayanamsa fine-tune (degrees)', ta: 'அயனாம்சம் சரிசெய்தல் (பாகை)', hint: 'Subtracted from every longitude. 0.0167 = 1 arc-minute.' },
  { k: 'node', sec: 'calc', type: 'select', def: 'mean', opts: ['mean', 'true'], en: 'Rahu/Ketu node', ta: 'ராகு/கேது' },
  { k: 'house_system', sec: 'calc', type: 'select', def: 'whole_sign', opts: ['whole_sign', 'equal', 'porphyry', 'placidus', 'koch', 'regiomontanus', 'campanus', 'topocentric', 'alcabitius', 'meridian', 'vehlow'], en: 'House (bhava) system', ta: 'பாவ முறை' },
  { k: 'sunrise_mode', sec: 'calc', type: 'select', def: 'upper_limb', opts: ['upper_limb', 'disc_center', 'geometric'], en: 'Sunrise definition', ta: 'சூரிய உதய வரையறை', hint: 'upper_limb: with refraction (common) · disc_center: centre of the Sun · geometric: centre, no refraction' },
  { k: 'day_starts', sec: 'calc', type: 'select', def: 'sunrise', opts: ['sunrise', 'midnight'], en: 'Day (vara) starts at', ta: 'நாள் தொடக்கம்' },
  { k: 'default_tz', sec: 'calc', type: 'number', def: 5.5, min: -12, max: 14, step: 0.25, en: 'Default time zone (hours)', ta: 'இயல்பு நேர மண்டலம் (மணி)', hint: 'Used when no place from the list is chosen.' },
  { k: 'dasa_year', sec: 'dasa', type: 'select', def: 'solar', opts: ['solar', 'savana', 'tropical', 'sidereal'], en: 'Dasa year length', ta: 'தசை ஆண்டு நீளம்', hint: 'solar 365.25 · savana 360 · tropical 365.2422 · sidereal 365.2564 days' },
  { k: 'dasa_depth', sec: 'dasa', type: 'select', def: 2, opts: [1, 2, 3], optLabels: ['maha', 'maha + antar', 'maha + antar + pratyantar'], en: 'Dasa depth', ta: 'தசை ஆழம்' },
  { k: 'antar_for', sec: 'dasa', type: 'select', def: 'running', opts: ['running', 'all', 'none'], en: 'Show bhukti tables for', ta: 'புக்தி அட்டவணை', hint: 'all = every maha dasa (longer report)' },
  { k: 'chart_style', sec: 'chart', type: 'select', def: 'south', opts: ['south', 'north'], en: 'Chart style', ta: 'கட்ட வடிவம்', hint: 'south: South-Indian grid · north: North-Indian diamond' },
  { k: 'show_rasi_chart', sec: 'chart', type: 'bool', def: true, en: 'Show rasi chart', ta: 'ராசி கட்டம்' },
  { k: 'show_navamsa_chart', sec: 'chart', type: 'bool', def: true, en: 'Show navamsa chart', ta: 'நவாம்ச கட்டம்' },
  { k: 'planet_label', sec: 'chart', type: 'select', def: 'short', opts: ['short', 'full'], en: 'Planet names in charts', ta: 'கட்டத்தில் கிரக பெயர்' },
  { k: 'lagna_marker', sec: 'chart', type: 'text', def: '⭐', max: 4, en: 'Lagna marker', ta: 'லக்ன குறி', hint: 'An emoji or a short text; empty for none.' },
  { k: 'show_nodes', sec: 'chart', type: 'bool', def: true, en: 'Show Rahu & Ketu', ta: 'ராகு கேது காட்டு' },
  { k: 'show_panchanga', sec: 'tables', type: 'bool', def: true, en: 'Panchanga section', ta: 'பஞ்சாங்கம்' },
  { k: 'show_planets', sec: 'tables', type: 'bool', def: true, en: 'Planet table', ta: 'கிரக அட்டவணை' },
  { k: 'show_lagna_row', sec: 'tables', type: 'bool', def: false, en: 'Lagna as a row in the planet table', ta: 'லக்னம் வரிசை' },
  { k: 'col_bhava', sec: 'tables', type: 'bool', def: true, en: 'Column: house (bhava)', ta: 'நெடுவரிசை: பாவம்' },
  { k: 'col_navamsa', sec: 'tables', type: 'bool', def: false, en: 'Column: navamsa sign', ta: 'நெடுவரிசை: நவாம்சம்' },
  { k: 'col_dignity', sec: 'tables', type: 'bool', def: true, en: 'Column: dignity', ta: 'நெடுவரிசை: நிலை' },
  { k: 'deg_format', sec: 'tables', type: 'select', def: 'decimal', opts: ['decimal', 'dms'], en: 'Degree format', ta: 'பாகை வடிவம்' },
  { k: 'show_dasa', sec: 'tables', type: 'bool', def: true, en: 'Dasa section', ta: 'தசை' },
  { k: 'gana', sec: 'match', type: 'select', def: 'deva_manushya_ok', opts: ['deva_manushya_ok', 'same_only'], en: 'Gana porutham', ta: 'கணப் பொருத்தம்' },
  { k: 'rasi_rule', sec: 'match', type: 'select', def: 'beyond_6th', opts: ['beyond_6th', 'avoid_shadashtaka'], en: 'Rasi porutham rule', ta: 'ராசிப் பொருத்த விதி', hint: 'beyond_6th: boy’s rasi 7th or later from girl’s · avoid_shadashtaka: only 6th/8th fail' },
  { k: 'rasyadhipati_mode', sec: 'match', type: 'select', def: 'non_enemy', opts: ['non_enemy', 'friends_only'], en: 'Rasi-adhipati rule', ta: 'ராசி அதிபதி விதி', hint: 'non_enemy: same lord or not enemies · friends_only: same lord or at least one friend' },
  { k: 'vasya_direction', sec: 'match', type: 'select', def: 'girl_to_boy', opts: ['girl_to_boy', 'either'], en: 'Vasya direction', ta: 'வசிய திசை' },
  { k: 'vedha', sec: 'match', type: 'select', def: 'common', opts: ['common', 'none'], en: 'Vedha porutham', ta: 'வேதைப் பொருத்தம்' },
  { k: 'stree_deergha_min', sec: 'match', type: 'number', def: 13, min: 0, max: 26, step: 1, en: 'Stree-deergha minimum', ta: 'ஸ்திரீ தீர்க்கம் குறைந்தபட்சம்', hint: 'Pass when the star count from the girl is greater than this (7, 13 or 15 are taught).' },
  { k: 'poruthams', sec: 'match', type: 'multi', def: PORUTHAMS, opts: PORUTHAMS, en: 'Poruthams to check', ta: 'பார்க்க வேண்டிய பொருத்தங்கள்' },
  { k: 'show_verdict', sec: 'match', type: 'bool', def: false, en: 'Show overall verdict', ta: 'இறுதி முடிவு காட்டு' },
  { k: 'min_pass', sec: 'match', type: 'number', def: 6, min: 0, max: 10, step: 1, en: 'Verdict: minimum poruthams passed', ta: 'முடிவு: குறைந்தபட்ச பொருத்தங்கள்' },
  { k: 'must_pass', sec: 'match', type: 'multi', def: ['rajju', 'vedha'], opts: PORUTHAMS, en: 'Verdict: must-pass poruthams', ta: 'முடிவு: கட்டாய பொருத்தங்கள்' },
  { k: 'lang', sec: 'report', type: 'select', def: 'ta', opts: ['ta', 'en'], en: 'Report / PDF language', ta: 'அறிக்கை மொழி' },
  { k: 'paper', sec: 'report', type: 'select', def: 'A4', opts: ['A4', 'Letter'], en: 'Paper size', ta: 'தாள் அளவு' },
  { k: 'font_size', sec: 'report', type: 'select', def: 'medium', opts: ['small', 'medium', 'large'], en: 'Report text size', ta: 'எழுத்து அளவு' },
  { k: 'accent', sec: 'report', type: 'text', def: '#8a3b07', max: 7, en: 'Accent colour (#rrggbb)', ta: 'நிறம் (#rrggbb)' },
  { k: 'date_format', sec: 'report', type: 'select', def: 'dmy_dash', opts: ['dmy_dash', 'dmy_slash', 'ymd', 'long'], optLabels: ['31-12-1990', '31/12/1990', '1990-12-31', '31 Dec 1990'], en: 'Date format', ta: 'தேதி வடிவம்' },
  { k: 'show_utc', sec: 'report', type: 'bool', def: true, en: 'Show UTC time of birth', ta: 'UTC நேரம் காட்டு', hint: 'Adds e.g. “= 00:30 UTC” next to the birth time.' },
  { k: 'time_format', sec: 'report', type: 'select', def: '24h', opts: ['24h', '12h'], en: 'Time format', ta: 'நேர வடிவம்' },
  { k: 'demo', sec: 'internal', type: 'bool', def: false, en: 'Demo watermark', ta: 'டெமோ' },
  { k: 'show_logo', sec: 'report', type: 'bool', def: true, en: 'Logo in header', ta: 'லோகோ' },
  { k: 'shop_name_ta', sec: 'report', type: 'text', def: '', max: 80, en: 'Shop name (Tamil)', ta: 'நிறுவனப் பெயர் (தமிழ்)' },
  { k: 'shop_name_en', sec: 'report', type: 'text', def: '', max: 80, en: 'Shop name (English)', ta: 'நிறுவனப் பெயர் (ஆங்கிலம்)' },
  { k: 'shop_phone', sec: 'report', type: 'text', def: '', max: 40, en: 'Phone', ta: 'தொலைபேசி' },
  { k: 'phone_icon', sec: 'report', type: 'text', def: '📱', max: 4, en: 'Phone icon', ta: 'தொலைபேசி குறி', hint: 'An emoji or short text shown before the number; empty for none.' },
  { k: 'shop_address', sec: 'report', type: 'text', def: '', max: 120, en: 'Address line (optional)', ta: 'முகவரி (விருப்பம்)' },
  { k: 'show_footer', sec: 'report', type: 'bool', def: true, en: 'Footer with name & phone', ta: 'அடிக்குறிப்பு' },
  { k: 'footer_note', sec: 'report', type: 'text', def: '', max: 160, en: 'Extra footer note (optional)', ta: 'கூடுதல் குறிப்பு (விருப்பம்)' },
  { k: 'ui_lang', sec: 'app', type: 'select', def: 'ta', opts: ['ta', 'en'], en: 'App language', ta: 'செயலி மொழி' },
  { k: 'icon_jath', sec: 'app', type: 'text', def: '🪐', max: 4, en: 'Tab icon: Jathagam', ta: 'குறி: ஜாதகம்' },
  { k: 'icon_match', sec: 'app', type: 'text', def: '💍', max: 4, en: 'Tab icon: Porutham', ta: 'குறி: பொருத்தம்' },
  { k: 'icon_set', sec: 'app', type: 'text', def: '⚙️', max: 4, en: 'Tab icon: Settings', ta: 'குறி: அமைப்புகள்' },
];
export const DEFAULTS = Object.fromEntries(SCHEMA.map((i) => [i.k, Array.isArray(i.def) ? [...i.def] : i.def]));
const DAYS = { solar: 365.25, savana: 360, tropical: 365.2422, sidereal: 365.25636 };
const NAK = 360 / 27;
const DAY = 86400000;

/** Validate + coerce a settings object against SCHEMA. Unknown keys are dropped; bad values throw. */
export function makeSettings(over = {}) {
  const s = {};
  for (const it of SCHEMA) {
    let v = it.k in over ? over[it.k] : DEFAULTS[it.k];
    if (it.type === 'select') {
      const hit = it.opts.find((o) => String(o) === String(v));
      if (hit === undefined) throw new Error(`${it.k}=${v}`);
      v = hit;
    } else if (it.type === 'number') {
      v = Number(v);
      if (!Number.isFinite(v)) throw new Error(`${it.k} must be a number`);
      v = Math.min(it.max, Math.max(it.min, v));
    } else if (it.type === 'bool') v = v === true || v === 'true' || v === 1;
    else if (it.type === 'text') {
      v = String(v ?? '').slice(0, it.max);
      if (it.k === 'accent' && !/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error('accent must look like #8a3b07');
    } else if (it.type === 'multi') v = it.opts.filter((o) => (Array.isArray(v) ? v : []).includes(o));
    s[it.k] = v;
  }
  return s;
}

export const SIGNS = 'Aries Taurus Gemini Cancer Leo Virgo Libra Scorpio Sagittarius Capricorn Aquarius Pisces'.split(' ');
export const NAKSHATRAS = ('Ashwini Bharani Krittika Rohini Mrigashira Ardra Punarvasu Pushya Ashlesha Magha PurvaPhalguni UttaraPhalguni Hasta Chitra Swati Vishakha Anuradha Jyeshtha Moola PurvaAshadha UttaraAshadha Shravana Dhanishta Shatabhisha PurvaBhadrapada UttaraBhadrapada Revati').split(' ');
const YOGAS = 'Vishkambha Priti Ayushman Saubhagya Shobhana Atiganda Sukarma Dhriti Shula Ganda Vriddhi Dhruva Vyaghata Harshana Vajra Siddhi Vyatipata Variyan Parigha Shiva Siddha Sadhya Shubha Shukla Brahma Indra Vaidhriti'.split(' ');
const KARANAS = 'Bava Balava Kaulava Taitila Gara Vanija Vishti'.split(' ');
const VARA = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ');   // JS getUTCDay order
const LORD = 'Mars Venus Mercury Moon Sun Mercury Venus Mars Jupiter Saturn Saturn Jupiter'.split(' ');
const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const DASA = [['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7], ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17]];
const FRIEND = { Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'], Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus'] };
const ENEMY = { Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'], Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars'] };
const EXALT = { Sun: [0, 10], Moon: [1, 3], Mars: [9, 28], Mercury: [5, 15], Jupiter: [3, 5], Venus: [11, 27], Saturn: [6, 20] };
const OWN = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
const MOOLA = { Sun: [4, 0, 20], Moon: [1, 3, 30], Mars: [0, 0, 12], Mercury: [5, 15, 20], Jupiter: [8, 0, 10], Venus: [6, 0, 15], Saturn: [10, 0, 20] };
const SIDM = { lahiri: 1, raman: 3, krishnamurti: 5, fagan_bradley: 0, true_chitra: 27, true_revati: 28, true_pushya: 29, true_mula: 35, true_sheoran: 39, ss_citra: 26, ss_revati: 25, yukteshwar: 7, jn_bhasin: 8, suryasiddhanta: 21, suryasiddhanta_msun: 22, aryabhata: 23, aryabhata_522: 37, deluce: 2, ushashashi: 4, j2000: 18, galcent_0sag: 17 };
const HSYS = { whole_sign: 'W', equal: 'E', placidus: 'P', porphyry: 'O', koch: 'K', regiomontanus: 'R', campanus: 'C', topocentric: 'T', alcabitius: 'B', meridian: 'X', vehlow: 'V' };

export const sign = (lon) => Math.floor(lon / 30) % 12;
export const nak = (lon) => [Math.floor(lon / NAK) % 27, Math.floor((lon % NAK) / (NAK / 4)) + 1];
const mod = (a, n) => ((a % n) + n) % n;

let swe;
export async function initEngine() {
  if (swe) return swe;
  const s = new SwissEph();
  await s.initSwissEph();
  swe = s;
  return s;
}

// local: {y, mo, d, h, mi}; returns ms of that wall time treated as UTC (naive-local arithmetic)
export const wallMs = (l) => Date.UTC(l.y, l.mo - 1, l.d, l.h, l.mi);

/** UTC offset (hours) of an IANA zone at a wall-clock moment (handles DST and historical changes). */
export function tzOffset(tzid, l) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tzid, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
  const off = (t) => {
    const p = Object.fromEntries(f.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t) / 3600000;
  };
  const w = wallMs(l);
  const o = off(w);
  return off(w - o * 3600000);
}

export function makeChart(local, tz, lat, lon, st = makeSettings(), place = '') {
  const s = swe;
  s.set_sid_mode(SIDM[st.ayanamsa], 0, 0);
  const ms = wallMs(local);
  const u = new Date(ms - tz * 3600000);
  const jd = s.julday(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(), u.getUTCHours() + u.getUTCMinutes() / 60 + u.getUTCSeconds() / 3600);
  const F = s.SEFLG_MOSEPH | s.SEFLG_SIDEREAL;
  const adj = st.ayanamsa_adjust || 0;
  const planets = {}, retro = {};
  for (const [n, b] of [['Sun', 0], ['Moon', 1], ['Mars', 4], ['Mercury', 2], ['Jupiter', 5], ['Venus', 3], ['Saturn', 6]]) {
    const r = s.calc_ut(jd, b, F | s.SEFLG_SPEED);
    planets[n] = mod(r[0] - adj, 360); retro[n] = r[3] < 0;
  }
  const rahu = mod(s.calc_ut(jd, st.node === 'mean' ? 10 : 11, F)[0] - adj, 360);
  planets.Rahu = rahu; planets.Ketu = (rahu + 180) % 360; retro.Rahu = retro.Ketu = true;
  const h = s.houses_ex(jd, F, lat, lon, HSYS[st.house_system]);
  const c = { local, ms, tz, lat, lon, st, jd, planets, retro, lagna: mod(h.ascmc[0] - adj, 360), cusps: Array.from(h.cusps).slice(1, 13).map((x) => mod(x - adj, 360)), place };
  c.signs = Object.fromEntries(Object.entries(planets).map(([k, v]) => [k, sign(v)]));
  return c;
}

export function house(c, lon) {
  if (c.st.house_system === 'whole_sign') return mod(sign(lon) - sign(c.lagna), 12) + 1;
  for (let i = 0; i < 12; i++) {
    const a = c.cusps[i], b = c.cusps[(i + 1) % 12];
    if (mod(lon - a, 360) < mod(b - a, 360)) return i + 1;
  }
  return 12;
}

export function dignity(p, lon) {
  if (!EXALT[p]) return '-';
  const s = sign(lon), d = lon % 30, es = EXALT[p][0];
  if (s === es) return 'exalted';
  if (s === (es + 6) % 12) return 'debilitated';
  const [ms, a, b] = MOOLA[p];
  if (s === ms && a <= d && d < b) return 'moolatrikona';
  if (OWN[p].includes(s)) return 'own';
  const lord = LORD[s];
  return FRIEND[p].includes(lord) ? 'friend' : ENEMY[p].includes(lord) ? 'enemy' : 'neutral';
}

export function navamsa(lon) {
  const s = sign(lon), k = Math.floor((lon % 30) / (30 / 9));
  return (s + [0, 8, 4][s % 3] + k) % 12;
}

function sunEvent(c, flag) {
  flag |= { upper_limb: 0, disc_center: 256, geometric: 256 | 512 }[c.st.sunrise_mode] || 0;   // SE_BIT_DISC_CENTER / SE_BIT_NO_REFRACTION
  const j0 = swe.julday(...(() => { const u = new Date(Date.UTC(c.local.y, c.local.mo - 1, c.local.d) - c.tz * 3600000); return [u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(), u.getUTCHours()]; })());
  const t = swe.rise_trans(j0, 0, '', swe.SEFLG_MOSEPH, flag, [c.lon, c.lat, 0], 0, 0);
  if (!t || !t[0]) return null;
  const r = swe.revjul(t[0] + c.tz / 24, 1);
  return Date.UTC(r.year, r.month - 1, r.day) + r.hour * 3600000;
}

export function panchanga(c) {
  const sun = c.planets.Sun, moon = c.planets.Moon, d = mod(moon - sun, 360);
  const t = Math.floor(d / 12), k = Math.floor(d / 6);
  const karana = k === 0 ? 'Kimstughna' : k === 57 ? 'Shakuni' : k === 58 ? 'Chatushpada' : k === 59 ? 'Naga' : KARANAS[(k - 1) % 7];
  const rise = sunEvent(c, 1), set = sunEvent(c, 2);
  let day = Date.UTC(c.local.y, c.local.mo - 1, c.local.d);
  if (c.st.day_starts === 'sunrise' && rise && c.ms < rise) day -= DAY;
  return { tithi: t + 1, paksha: t < 15 ? 'Shukla' : 'Krishna', karana, yoga: YOGAS[Math.floor(mod(moon + sun, 360) / NAK)],
    nakshatra: NAKSHATRAS[nak(moon)[0]], vara: VARA[new Date(day).getUTCDay()], sunrise: rise, sunset: set };
}

function subs(lord, start, days, depth) {
  const i = DASA.findIndex((x) => x[0] === lord), out = [];
  let t = start;
  for (let k = 0; k < 9; k++) {
    const [n, y] = DASA[(i + k) % 9], span = (days * y) / 120;
    out.push({ lord: n, start: t, end: t + span * DAY, sub: depth > 1 ? subs(n, t, span, depth - 1) : [] });
    t += span * DAY;
  }
  return out;
}
const trim = (list, birth) => list.filter((s) => s.end > birth).map((s) => ({ ...s, start: Math.max(s.start, birth), sub: trim(s.sub, birth) }));

export function dasas(c) {
  const yr = DAYS[c.st.dasa_year], moon = c.planets.Moon;
  const idx = Math.floor(moon / NAK) % 9, frac = (moon % NAK) / NAK;
  const out = []; let t = c.ms;
  for (let k = 0; k < 9; k++) {
    const [lord, y] = DASA[(idx + k) % 9], full = y * yr, span = k === 0 ? full * (1 - frac) : full;
    const startFull = k === 0 ? t - full * frac * DAY : t;
    const sb = c.st.dasa_depth > 1 ? trim(subs(lord, startFull, full, c.st.dasa_depth - 1), t) : [];
    out.push({ lord, start: t, end: t + span * DAY, sub: sb });
    t += span * DAY;
  }
  return out;
}

// ---- porutham (stars 0..26, rasis 0..11; true = pass)
const DEVA = new Set([0, 4, 6, 7, 12, 14, 16, 21, 26]), RAKSHASA = new Set([2, 8, 9, 13, 15, 17, 18, 22, 23]);
const YONI = 'horse elephant sheep serpent serpent dog cat sheep cat rat rat cow buffalo tiger buffalo tiger deer deer dog monkey mongoose monkey lion horse lion cow elephant'.split(' ');
const YONI_ENEMY = [['cow', 'tiger'], ['elephant', 'lion'], ['horse', 'buffalo'], ['dog', 'deer'], ['serpent', 'mongoose'], ['monkey', 'sheep'], ['cat', 'rat']];
const RAJJU = [[0, 8, 9, 17, 18, 26], [1, 7, 10, 16, 19, 25], [2, 6, 11, 15, 20, 24], [3, 5, 12, 14, 21, 23], [4, 13, 22]];
const VEDHA = [[0, 17], [1, 16], [2, 15], [3, 14], [5, 21], [6, 20], [7, 19], [8, 18], [9, 26], [10, 25], [11, 24], [12, 23], [4, 13], [4, 22], [13, 22]];
const VASYA = { 0: [4, 7], 1: [3, 6], 2: [5], 3: [8, 7], 4: [6], 5: [2, 11], 6: [5, 9], 7: [3], 8: [11], 9: [10, 0], 10: [0], 11: [9] };
const gana = (s) => (DEVA.has(s) ? 0 : RAKSHASA.has(s) ? 2 : 1);
const pair = (a, b, list) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export function match(gStar, gRasi, bStar, bRasi, st = makeSettings()) {
  const n = mod(bStar - gStar, 27) + 1, gg = gana(gStar), gb = gana(bStar);
  const gl = LORD[gRasi], bl = LORD[bRasi], r = mod(bRasi - gRasi, 12) + 1;
  const res = {
    dina: [2, 4, 6, 8, 0].includes(n % 9),
    gana: gg === gb || (st.gana === 'deva_manushya_ok' && ((gg === 0 && gb === 1) || (gg === 1 && gb === 0))),
    mahendra: [4, 7, 10, 13, 16, 19, 22, 25].includes(n),
    stree_deergha: n > st.stree_deergha_min,
    yoni: !pair(YONI[gStar], YONI[bStar], YONI_ENEMY),
    rasi: st.rasi_rule === 'beyond_6th' ? r > 6 : ![6, 8].includes(r),
    rasyadhipati: gl === bl || (!ENEMY[gl].includes(bl) && !ENEMY[bl].includes(gl) && (st.rasyadhipati_mode !== 'friends_only' || FRIEND[gl].includes(bl) || FRIEND[bl].includes(gl))),
    vasya: VASYA[gRasi].includes(bRasi) || (st.vasya_direction === 'either' && VASYA[bRasi].includes(gRasi)),
    rajju: !RAJJU.some((g) => g.includes(gStar) && g.includes(bStar)),
    vedha: st.vedha === 'none' || !pair(gStar, bStar, VEDHA),
  };
  return Object.fromEntries(st.poruthams.map((k) => [k, res[k]]));
}

export function matchCharts(girl, boy, st) {
  st = st || girl.st;
  const g = girl.planets.Moon, b = boy.planets.Moon;
  const r = match(nak(g)[0], sign(g), nak(b)[0], sign(b), st);
  return [r, Object.values(r).filter(Boolean).length, Object.keys(r).length];
}

// ---------------- report (HTML used on screen and for PDF)
const TA = {
  planets: { Sun: 'சூரியன்', Moon: 'சந்திரன்', Mars: 'செவ்வாய்', Mercury: 'புதன்', Jupiter: 'குரு', Venus: 'சுக்கிரன்', Saturn: 'சனி', Rahu: 'ராகு', Ketu: 'கேது' },
  short: { Sun: 'சூ', Moon: 'சந்', Mars: 'செ', Mercury: 'பு', Jupiter: 'குரு', Venus: 'சுக்', Saturn: 'சனி', Rahu: 'ரா', Ketu: 'கே' },
  signs: 'மேஷம் ரிஷபம் மிதுனம் கடகம் சிம்மம் கன்னி துலாம் விருச்சிகம் தனுசு மகரம் கும்பம் மீனம்'.split(' '),
  stars: 'அசுவினி பரணி கார்த்திகை ரோகிணி மிருகசீரிடம் திருவாதிரை புனர்பூசம் பூசம் ஆயில்யம் மகம் பூரம் உத்திரம் அஸ்தம் சித்திரை சுவாதி விசாகம் அனுஷம் கேட்டை மூலம் பூராடம் உத்திராடம் திருவோணம் அவிட்டம் சதயம் பூரட்டாதி உத்திரட்டாதி ரேவதி'.split(' '),
  dignity: { exalted: 'உச்சம்', debilitated: 'நீசம்', moolatrikona: 'மூலத்திரிகோணம்', own: 'ஆட்சி', friend: 'நட்பு', neutral: 'சமம்', enemy: 'பகை' },
  tithi: 'பிரதமை துவிதியை திருதியை சதுர்த்தி பஞ்சமி சஷ்டி சப்தமி அஷ்டமி நவமி தசமி ஏகாதசி துவாதசி திரயோதசி சதுர்தசி'.split(' '),
  yogas: 'விஷ்கம்பம் ப்ரீதி ஆயுஷ்மான் சௌபாக்யம் சோபனம் அதிகண்டம் சுகர்மம் திருதி சூலம் கண்டம் விருத்தி துருவம் வியாகாதம் ஹர்ஷணம் வஜ்ரம் சித்தி வியதீபாதம் வரீயான் பரிகம் சிவம் சித்தம் சாத்தியம் சுபம் சுக்லம் பிரம்மம் ஐந்திரம் வைதிருதி'.split(' '),
  karana: { Bava: 'பவம்', Balava: 'பாலவம்', Kaulava: 'கௌலவம்', Taitila: 'தைதுலை', Gara: 'கரசை', Vanija: 'வணிசை', Vishti: 'பத்திரை', Shakuni: 'சகுனி', Chatushpada: 'சதுஷ்பாதம்', Naga: 'நாகவம்', Kimstughna: 'கிம்ஸ்துக்னம்' },
  vara: { Sunday: 'ஞாயிறு', Monday: 'திங்கள்', Tuesday: 'செவ்வாய்', Wednesday: 'புதன்', Thursday: 'வியாழன்', Friday: 'வெள்ளி', Saturday: 'சனி' },
  paksha: { Shukla: 'வளர்பிறை', Krishna: 'தேய்பிறை' },
  poruthams: { dina: 'தினப் பொருத்தம்', gana: 'கணப் பொருத்தம்', mahendra: 'மகேந்திரப் பொருத்தம்', stree_deergha: 'ஸ்திரீ தீர்க்கம்', yoni: 'யோனிப் பொருத்தம்', rasi: 'ராசிப் பொருத்தம்', rasyadhipati: 'ராசி அதிபதி பொருத்தம்', vasya: 'வசியப் பொருத்தம்', rajju: 'ரஜ்ஜுப் பொருத்தம்', vedha: 'வேதைப் பொருத்தம்' },
  ui: { title: 'ஜாதகம்', match: 'பொருத்தம்', name: 'பெயர்', born: 'பிறந்த நேரம்', place: 'இடம்', lagna: 'லக்னம்', planet: 'கிரகம்', rasi: 'ராசி', deg: 'பாகை', star: 'நட்சத்திரம்', bhava: 'பாவம்', state: 'நிலை', rasi_chart: 'ராசி', nav_chart: 'நவாம்சம்', dasa: 'விம்சோத்தரி தசை', panch: 'பஞ்சாங்கம்', tithi: 'திதி', yoga: 'யோகம்', karana: 'கரணம்', vara: 'கிழமை', rise: 'சூரிய உதயம்', set: 'அஸ்தமனம்', girl: 'பெண்', boy: 'ஆண்', ok: 'பொருத்தம்', no: 'இல்லை', total: 'மொத்தம்', retro: 'வக்ரம்', ayan: 'அயனாம்சம்', running: 'நடப்பு புக்தி', asc: 'லக்' },
};
const UI_EN = { title: 'Jathagam', match: 'Porutham', name: 'Name', born: 'Born', place: 'Place', lagna: 'Lagna', planet: 'Planet', rasi: 'Rasi', deg: 'Degree', star: 'Nakshatra', bhava: 'House', state: 'State', rasi_chart: 'Rasi', nav_chart: 'Navamsa', dasa: 'Vimshottari Dasa', panch: 'Panchanga', tithi: 'Tithi', yoga: 'Yoga', karana: 'Karana', vara: 'Weekday', rise: 'Sunrise', set: 'Sunset', girl: 'Girl', boy: 'Boy', ok: 'Match', no: 'No', total: 'Total', retro: 'R', ayan: 'Ayanamsa', running: 'Running bhukti', asc: 'Asc', nav: 'Navamsa', rec: 'Recommended', notrec: 'Not recommended', need: 'minimum', failed: 'failed' };
Object.assign(TA.ui, { nav: 'நவாம்சம்', rec: 'பொருத்தம் உண்டு', notrec: 'பொருத்தம் இல்லை', need: 'குறைந்தபட்சம்', failed: 'இல்லாதவை' });
const GRID = { '0,0': 11, '0,1': 0, '0,2': 1, '0,3': 2, '1,3': 3, '2,3': 4, '3,3': 5, '3,2': 6, '3,1': 7, '3,0': 8, '2,0': 9, '1,0': 10 };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
const FONT_PX = { small: 11, medium: 13, large: 15 };

export const REPORT_CSS = `.rp{font-family:'Noto Serif Tamil','Noto Sans Tamil',serif;font-size:var(--fs,13px);color:#111}
.rp h1{text-align:center;margin:0;font-size:1.55em;flex:1}.rp .hd{display:flex;align-items:center;gap:8px;margin-bottom:6px}.rp .hd img{width:54px;height:54px;flex:none}
.rp .shop{font-size:.92em;line-height:1.35}.rp .shop b{font-size:1.08em;color:var(--acc,#8a3b07)}
.rp h2{font-size:1.08em;color:var(--acc,#8a3b07);border-bottom:1px solid var(--acc,#8a3b07);margin:12px 0 5px}.rp h3{font-size:1em;margin:8px 0 3px}
.rp table{border-collapse:collapse;width:100%}.rp td,.rp th{border:1px solid #666;padding:3px 5px;text-align:left}
.rp .row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:8px}.rp .col{flex:1 1 150px;min-width:140px}
.rp table.chart{table-layout:fixed;width:100%;max-width:62mm;margin:0 auto}.rp table.chart td{height:46px;font-size:.78em;vertical-align:top;padding:2px}
.rp svg.nc{display:block;width:100%;max-width:62mm;margin:0 auto}.rp .ct{text-align:center;font-weight:700;font-size:.95em;margin-bottom:2px}
.rp .ok{color:#116611}.rp .no{color:#aa1111}.rp .c{text-align:center}.rp .verdict{margin-top:8px;padding:6px 8px;border:2px solid;font-weight:700;text-align:center}
.rp .col.wide{flex:1 1 270px}.rp td.d{white-space:nowrap}.rp .foot{text-align:center;margin-top:12px;font-size:.92em}.rp .addr{font-size:.85em}
.rp.demo{position:relative}.rp.demo::after{content:'';position:absolute;inset:0;pointer-events:none;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='170'><text x='120' y='90' text-anchor='middle' transform='rotate(-25 120 85)' font-family='sans-serif' font-size='44' font-weight='bold' fill='rgba(190,0,0,0.20)'>DEMO</text></svg>")}`;

function L(st) {
  const ta = st.lang === 'ta';
  return {
    ta, st, ui: ta ? TA.ui : UI_EN,
    planet: (g) => (ta ? TA.planets[g] : g), short: (g) => (ta ? TA.short[g] : g.slice(0, 2)),
    label: (g) => (st.planet_label === 'full' ? (ta ? TA.planets[g] : g) : ta ? TA.short[g] : g.slice(0, 2)),
    sign: (i) => (ta ? TA.signs[i] : SIGNS[i]), star: (i) => (ta ? TA.stars[i] : NAKSHATRAS[i]),
    dig: (d) => (ta ? TA.dignity[d] || '-' : d),
    date: (ms) => fmtDate(ms, st),
  };
}
function fmtDate(ms, st) {
  if (ms == null) return '-';
  const d = new Date(ms), D = pad(d.getUTCDate()), M = pad(d.getUTCMonth() + 1), Y = d.getUTCFullYear();
  return { dmy_slash: `${D}/${M}/${Y}`, ymd: `${Y}-${M}-${D}`, long: `${D} ${MON[d.getUTCMonth()]} ${Y}` }[st.date_format] || `${D}-${M}-${Y}`;
}
function fmtTime(h, mi, st) { return st.time_format === '12h' ? `${h % 12 || 12}:${pad(mi)} ${h < 12 ? 'AM' : 'PM'}` : `${pad(h)}:${pad(mi)}`; }
const hm = (ms, st) => (ms == null ? '-' : fmtTime(new Date(ms).getUTCHours(), new Date(ms).getUTCMinutes(), st));
const fmtLocal = (l, st) => `${fmtDate(wallMs(l), st)} ${fmtTime(l.h, l.mi, st)}`;
function fmtDeg(x, st) {
  if (st.deg_format === 'dms') { const d = Math.floor(x), m = Math.floor((x - d) * 60); return `${d}°${pad(m)}′`; }
  return `${x.toFixed(2)}°`;
}
const tzName = (tz) => (tz === 5.5 ? 'IST ' : '');
/** Birth time with zone name (IST/UTC when it applies), offset, and optionally the UTC equivalent. */
function bornText(c, st) {
  const off = `UTC${c.tz >= 0 ? '+' : ''}${c.tz}`;
  let t = `${fmtLocal(c.local, st)} ${tzName(c.tz)}(${off})`;
  if (st.show_utc && c.tz !== 0) {
    const u = new Date(c.ms - c.tz * 3600000);
    t += ` = ${fmtTime(u.getUTCHours(), u.getUTCMinutes(), st)} UTC${u.getUTCDate() !== c.local.d ? ' (' + fmtDate(u.getTime(), st) + ')' : ''}`;
  }
  return t;
}
const marker = (Lb) => `${Lb.st.lagna_marker} ${Lb.ui.asc}`.trim();
const shown = (c) => Object.keys(c.planets).filter((g) => c.st.show_nodes || (g !== 'Rahu' && g !== 'Ketu'));

function chartHtml(Lb, bySign, lagnaSign, title) {
  if (Lb.st.chart_style === 'north') return northHtml(Lb, bySign, lagnaSign, title);
  let rows = '';
  for (let r = 0; r < 4; r++) {
    let tds = '';
    for (let c = 0; c < 4; c++) {
      const i = GRID[`${r},${c}`];
      if (i !== undefined) tds += `<td>${esc([...(i === lagnaSign ? [marker(Lb)] : []), ...(bySign[i] || [])].join(' '))}</td>`;
      else if (r === 1 && c === 1) tds += `<td colspan=2 rowspan=2 class=c><b>${esc(title)}</b></td>`;
    }
    rows += `<tr>${tds}</tr>`;
  }
  return `<div class=col><table class=chart>${rows}</table></div>`;
}

// North-Indian diamond: house 1 is always the top diamond, signs rotate from the lagna sign.
const NPOS = [[100, 56], [50, 28], [28, 50], [56, 100], [28, 150], [50, 172], [100, 144], [150, 172], [172, 150], [144, 100], [172, 50], [150, 28]];
function northHtml(Lb, bySign, lagnaSign, title) {
  let t = '';
  for (let h = 0; h < 12; h++) {
    const sg = (lagnaSign + h) % 12, [x, y] = NPOS[h];
    const items = [...(h === 0 && Lb.st.lagna_marker ? [Lb.st.lagna_marker] : []), ...(bySign[sg] || [])];
    const lines = [];
    for (let i = 0; i < items.length; i += 2) lines.push(items.slice(i, i + 2).join(' '));
    const y0 = y - ((lines.length + 1) * 11) / 2 + 9;
    t += `<text x="${x}" y="${y0}" text-anchor="middle" font-size="9" fill="#888">${sg + 1}</text>`;
    lines.forEach((ln, i) => (t += `<text x="${x}" y="${y0 + 11 * (i + 1)}" text-anchor="middle" font-size="10">${esc(ln)}</text>`));
  }
  return `<div class=col><div class=ct>${esc(title)}</div><svg class=nc viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#444" stroke-width="1.2"><rect x="1" y="1" width="198" height="198"/><line x1="1" y1="1" x2="199" y2="199"/><line x1="199" y1="1" x2="1" y2="199"/><polygon points="100,1 199,100 100,199 1,100"/></g>${t}</svg></div>`;
}

function charts(Lb, c, tag = '') {
  const st = c.st, a = {}, b = {};
  for (const g of shown(c)) { const x = c.planets[g]; (a[sign(x)] ??= []).push(Lb.label(g)); (b[navamsa(x)] ??= []).push(Lb.label(g)); }
  return (st.show_rasi_chart ? chartHtml(Lb, a, sign(c.lagna), tag + Lb.ui.rasi_chart) : '') +
    (st.show_navamsa_chart ? chartHtml(Lb, b, navamsa(c.lagna), tag + Lb.ui.nav_chart) : '');
}

let logoOverride = null;
/** A user-supplied logo (data URL) for report headers; null restores the built-in one. */
export const setLogo = (u) => { logoOverride = u || null; };
const head = (title, st) => `<div class=hd>${st.show_logo ? `<img src="${logoOverride || LOGO}" alt="">` : ''}<div class=shop><b>${esc(st.lang === 'ta' ? st.shop_name_ta : st.shop_name_en)}</b>${st.shop_phone ? `<div>${st.phone_icon ? esc(st.phone_icon) + ' ' : ''}${esc(st.shop_phone)}</div>` : ''}${st.shop_address ? `<div class=addr>${esc(st.shop_address)}</div>` : ''}</div><h1>${title}</h1></div>`;
const footer = (st) => (st.show_footer || st.footer_note ? `<div class=foot>${st.show_footer ? esc(st.lang === 'ta' ? st.shop_name_ta : st.shop_name_en) + (st.shop_phone ? ' &nbsp; Ph: ' + esc(st.shop_phone) : '') : ''}${st.footer_note ? `<div>${esc(st.footer_note)}</div>` : ''}</div>` : '');
const place = (c) => esc(c.place || `${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}`);
const wrap = (st, inner) => `<div class="rp${st.demo ? ' demo' : ''}" style="--acc:${st.accent};--fs:${FONT_PX[st.font_size]}px">${inner}</div>`;

export function jathagamHtml(c, name = '', now = Date.now()) {
  const st = c.st, Lb = L(st), u = Lb.ui, star = nak(c.planets.Moon);
  const pan = panchanga(c);
  const cols = [['planet', u.planet], ['rasi', u.rasi], ['deg', u.deg], ['star', u.star], ...(st.col_bhava ? [['bhava', u.bhava]] : []), ...(st.col_navamsa ? [['nav', u.nav]] : []), ...(st.col_dignity ? [['state', u.state]] : [])];
  const cell = (k, v) => v[k];
  const prow = (label, x, retro, dig, hs) => {
    const [s, p] = nak(x);
    const v = { planet: label + (retro ? ` (${u.retro})` : ''), rasi: Lb.sign(sign(x)), deg: fmtDeg(x % 30, st), star: `${Lb.star(s)} ${p}`, bhava: hs, nav: Lb.sign(navamsa(x)), state: dig };
    return `<tr>${cols.map(([k]) => `<td>${cell(k, v)}</td>`).join('')}</tr>`;
  };
  let rows = st.show_lagna_row ? prow(u.lagna, c.lagna, false, '-', 1) : '';
  for (const g of shown(c)) rows += prow(Lb.planet(g), c.planets[g], c.retro[g] && g !== 'Rahu' && g !== 'Ketu', Lb.dig(dignity(g, c.planets[g])), house(c, c.planets[g]));
  const ti = (pan.tithi - 1) % 15, pk = Lb.ta ? TA.paksha[pan.paksha] : pan.paksha;
  const tithi = Lb.ta ? `${ti === 14 ? (pan.paksha === 'Shukla' ? 'பௌர்ணமி' : 'அமாவாசை') : TA.tithi[ti]} (${pk})` : `${pan.paksha} ${ti + 1}`;
  const yoga = Lb.ta ? TA.yogas[YOGAS.indexOf(pan.yoga)] : pan.yoga, karana = Lb.ta ? TA.karana[pan.karana] : pan.karana;
  const vara = Lb.ta ? TA.vara[pan.vara] : pan.vara;
  const maha = dasas(c), cur = maha.find((m) => m.start <= now && now < m.end);
  const tr = (m) => `<tr><td>${Lb.planet(m.lord)}</td><td class=d>${Lb.date(m.start)}</td><td class=d>${Lb.date(m.end)}</td></tr>`;
  let antar = '', allSub = '';
  if (st.antar_for === 'running' && cur && cur.sub.length) antar = `<div class="col wide"><h2>${u.running}: ${Lb.planet(cur.lord)}</h2><table>${cur.sub.map(tr).join('')}</table></div>`;
  if (st.antar_for === 'all') allSub = `<div class=row>${maha.filter((m) => m.sub.length).map((m) => `<div class=col><h3>${Lb.planet(m.lord)}</h3><table>${m.sub.map(tr).join('')}</table></div>`).join('')}</div>`;
  const chartRow = st.show_rasi_chart || st.show_navamsa_chart ? `<div class=row>${charts(Lb, c)}</div>` : '';
  return wrap(st, `${head(u.title, st)}
<table><tr><td>${u.name}</td><td>${esc(name) || '-'}</td><td>${u.born}</td><td>${bornText(c, st)}</td></tr>
<tr><td>${u.place}</td><td>${place(c)}</td><td>${u.lagna}${st.lagna_marker ? ' ' + esc(st.lagna_marker) : ''}</td><td>${Lb.sign(sign(c.lagna))} ${fmtDeg(c.lagna % 30, st)}</td></tr>
<tr><td>${u.ayan}</td><td>${st.ayanamsa}</td><td>${u.star}</td><td>${Lb.star(star[0])} ${star[1]}</td></tr></table>
${st.show_panchanga ? `<h2>${u.panch}</h2><table><tr><td>${u.tithi}</td><td>${tithi}</td><td>${u.yoga}</td><td>${yoga}</td><td>${u.karana}</td><td>${karana}</td></tr>
<tr><td>${u.vara}</td><td>${vara}</td><td>${u.rise}</td><td>${hm(pan.sunrise, st)}</td><td>${u.set}</td><td>${hm(pan.sunset, st)}</td></tr></table>` : ''}
${st.show_planets ? `<h2>${u.planet}</h2><table><tr>${cols.map(([, l]) => `<th>${l}</th>`).join('')}</tr>${rows}</table>` : ''}
${chartRow}
${st.show_dasa ? `<div class=row style="align-items:flex-start"><div class="col wide"><h2>${u.dasa}</h2><table>${maha.map(tr).join('')}</table></div>${antar}</div>${allSub}` : ''}${footer(st)}`);
}

export function verdict(res, st) {
  const ok = Object.values(res).filter(Boolean).length;
  const failed = st.must_pass.filter((k) => k in res && !res[k]);
  return { good: ok >= st.min_pass && !failed.length, ok, failed };
}

export function poruthamHtml(girl, boy, names = ['', ''], st) {
  st = st || girl.st;
  const Lb = L(st), u = Lb.ui, [res, ok, n] = matchCharts(girl, boy, st);
  const who = [[u.girl, names[0], girl], [u.boy, names[1], boy]].map(([lab, nm, ch]) => {
    const m = ch.planets.Moon, [s, p] = nak(m);
    return `<tr><td>${lab}</td><td>${esc(nm) || '-'}</td><td>${Lb.star(s)} ${p}</td><td>${Lb.sign(sign(m))}</td><td>${fmtLocal(ch.local, st)} ${tzName(ch.tz).trim()}</td><td>${place(ch)}</td></tr>`;
  }).join('');
  const label = (k) => (Lb.ta ? TA.poruthams[k] : k.replace(/_/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase()));
  const rows = Object.entries(res).map(([k, v]) => `<tr><td>${label(k)}</td><td class='${v ? 'ok' : 'no'}'>${v ? u.ok : u.no}</td></tr>`).join('');
  let vd = '';
  if (st.show_verdict) {
    const v = verdict(res, st);
    vd = `<div class="verdict ${v.good ? 'ok' : 'no'}">${v.good ? u.rec : u.notrec} (${v.ok}/${n}, ${u.need} ${st.min_pass}${v.failed.length ? `; ${u.failed}: ${v.failed.map(label).join(', ')}` : ''})</div>`;
  }
  const gc = charts(Lb, girl, u.girl + ' '), bc = charts(Lb, boy, u.boy + ' ');
  return wrap(st, `${head(u.match, st)}<table><tr><th></th><th>${u.name}</th><th>${u.star}</th><th>${u.rasi}</th><th>${u.born}</th><th>${u.place}</th></tr>${who}</table>
${gc ? `<div class=row>${gc}</div><div class=row>${bc}</div>` : ''}
<h2>${u.match}</h2><table>${rows}<tr><td><b>${u.total}</b></td><td><b>${ok} / ${n}</b></td></tr></table>${vd}${footer(st)}`);
}
