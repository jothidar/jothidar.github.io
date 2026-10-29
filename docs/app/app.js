import * as V from './vedic.js';

const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let settings;
try { settings = V.makeSettings(store.get('settings', {})); } catch { settings = V.makeSettings(); }   // corrupt stored settings -> defaults
let places = [];

// ---- the app is free: every feature is unlocked. (`paid` and the demo/buy code below are kept inert.)
const paid = true;
const LOCKED = new Set(['shop_name_ta', 'shop_name_en', 'shop_phone', 'phone_icon', 'shop_address', 'show_logo', 'show_footer', 'footer_note']);
let customLogo = store.get('logo', null);
/** Settings the reports use: in demo, the owner's details are blanked and a watermark is added. */
const eff = () => (paid ? settings : V.makeSettings({ ...settings, shop_name_ta: '', shop_name_en: '', shop_phone: '', shop_address: '', footer_note: '', show_footer: false, show_logo: true, demo: true }));
const syncLogo = () => { V.setLogo(paid ? customLogo : null); $('#hlogo').src = (paid && customLogo) || 'logo.png'; };
const style = document.createElement('style'); style.textContent = V.REPORT_CSS; document.head.append(style);

const T = {
  ta: { jath: 'ஜாதகம்', match: 'பொருத்தம்', set: 'அமைப்புகள்', name: 'பெயர்', date: 'பிறந்த தேதி', time: 'பிறந்த நேரம்', place: 'பிறந்த ஊர் (பெயர் தட்டச்சு செய்யவும்)',
    manual: 'ஊர் பட்டியலில் இல்லையா? அட்சரேகை/தீர்க்கரேகை', lat: 'அட்சரேகை', lon: 'தீர்க்கரேகை', tz: 'நேர மண்டலம் (மணி)', tzauto: 'தானியங்கி', tzsel: 'நேர மண்டலம்', tzist: 'IST (+5:30)',
    go: 'ஜாதகம் கணி', gom: 'பொருத்தம் பார்', pdf: 'PDF ஆக சேமி', girl: 'பெண்', boy: 'ஆண்', save: 'சேமி', load: 'சேமித்தவை', del: 'நீக்கு', reset: 'இயல்புநிலைக்கு மாற்று',
    loading: 'ஏற்றுகிறது…', nores: 'முடிவுகள் இல்லை', need: 'பெயர், தேதி, நேரம், ஊர் தேவை', reset: 'இயல்புநிலைக்கு மாற்று', exp: 'அமைப்புகளை நகலெடு', imp: 'அமைப்புகளை ஏற்று', backup: 'காப்புப் பிரதி', paste: 'இங்கே ஒட்டவும்', ok: 'ஏற்றப்பட்டது', bad: 'தவறான அமைப்புகள்: ' },
  en: { jath: 'Jathagam', match: 'Porutham', set: 'Settings', name: 'Name', date: 'Date of birth', time: 'Time of birth', place: 'Birth place (type a name)',
    manual: 'Not in the list? Enter latitude/longitude', lat: 'Latitude', lon: 'Longitude', tz: 'Time zone (hours)', tzauto: 'automatic', tzsel: 'Time zone', tzist: 'IST (+5:30)',
    go: 'Make jathagam', gom: 'Check porutham', pdf: 'Save as PDF', girl: 'Girl', boy: 'Boy', save: 'Save', load: 'Saved', del: 'Delete', reset: 'Reset to defaults',
    loading: 'Loading…', nores: 'No results', need: 'Name, date, time and place are required', reset: 'Reset to defaults', exp: 'Show settings JSON', imp: 'Import settings', backup: 'Backup & restore', paste: 'Paste here', ok: 'Imported', bad: 'Invalid settings: ' },
};
Object.assign(T.ta, { buyMsg: 'இது டெமோ பதிப்பு. ₹250 செலுத்தி முழு செயலியை வாங்கினால் வாழ்நாள் முழுவதும் பயன்படுத்தலாம் — PDF சேமிப்பு, உங்கள் லோகோ, நிறுவனப் பெயர், தொலைபேசி மற்றும் அனைத்து மாற்றங்களும் கிடைக்கும்.', buy: '₹250 செலுத்தி வாங்கு', later: 'பிறகு', thanks: 'நன்றி! முழு செயலி திறக்கப்பட்டது.', nobuy: 'வாங்கும் வசதி இந்தச் சாதனத்தில் இல்லை (Google Play தேவை).', cont: 'தொடர்' });
Object.assign(T.en, { buyMsg: 'This is the demo version. Pay ₹250 once to own the full app and use it forever — PDF saving, your own logo, business name, phone and every customisation.', buy: 'Buy for ₹250', later: 'Later', thanks: 'Thank you! The full app is unlocked.', nobuy: 'Purchase is not available on this device (Google Play required).', cont: 'Continue' });
const t = (k) => T[settings.ui_lang][k];
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:76px;background:#1c1917;color:#fff;padding:10px 14px;border-radius:10px;z-index:9;font-size:14px'; document.body.append(el); }
  el.textContent = msg; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => (el.hidden = true), 3500);
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- places: rows [name, tamil, admin, country, lat, lon, tzid]
async function loadPlaces() {
  try { places = await (await fetch('data/places.json')).json(); } catch { places = []; }
}
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
function searchPlaces(q) {
  q = norm(q.trim());
  if (q.length < 2) return [];
  const a = [], b = [];
  for (const p of places) {
    const n = norm(p[0]), ta = p[1] || '';
    if (n.startsWith(q) || ta.startsWith(q)) a.push(p);
    else if (n.includes(q) || ta.includes(q)) b.push(p);
    if (a.length >= 12) break;
  }
  return [...a, ...b].slice(0, 12);
}
const placeLabel = (p) => (settings.ui_lang === 'ta' && p[1] ? p[1] : p[0]);

// ---- birth form
function birthForm(root, id, title) {
  const people = () => store.get('people', []);
  root.innerHTML = `<fieldset><legend>${esc(title)}</legend>
  <label>${t('load')}</label><div class=two><select class=ld><option value="">—</option></select><button class="act alt dl" type=button>${t('del')}</button></div>
  <label>${t('name')}</label><input class=nm autocomplete=off>
  <div class=two><div><label>${t('date')}</label><input type=date class=dt></div><div><label>${t('time')}</label><input type=time class=tm></div></div>
  <label>${t('place')}</label><input class=pl autocomplete=off><div class=sug hidden></div>
  <label>${t('tzsel')}</label><select class=tzs><option value=auto>${t('tzauto')}</option><option value=ist>${t('tzist')}</option></select>
  <details><summary class=hint>${t('manual')}</summary><div class=three>
    <div><label>${t('lat')}</label><input class=la type=number step=any></div><div><label>${t('lon')}</label><input class=lo type=number step=any></div>
    <div><label>${t('tz')}</label><input class=tz type=number step=any placeholder="${t('tzauto')}"></div></div></details>
  <button class="act alt sv" type=button>${t('save')}</button></fieldset>`;
  const q = (s) => $(s, root);
  let chosen = null;                                  // {label, lat, lon, tzid}
  const refresh = () => {
    q('.ld').innerHTML = `<option value="">—</option>` + people().map((p, i) => `<option value=${i}>${esc(p.name)} · ${esc(p.date)}</option>`).join('');
  };
  refresh();
  q('.pl').addEventListener('input', () => {
    chosen = null;
    const r = searchPlaces(q('.pl').value), box = q('.sug');
    box.hidden = !r.length && q('.pl').value.trim().length < 2;
    box.innerHTML = r.length ? r.map((p, i) => `<div data-i=${i}>${esc(placeLabel(p))} <small>${esc(p[2])}${p[2] ? ', ' : ''}${esc(p[3])}</small></div>`).join('') : `<div><small>${t('nores')}</small></div>`;
    box._r = r;
  });
  q('.tzs').onchange = () => { q('.tz').value = { auto: '', ist: '5.5' }[q('.tzs').value]; };
  q('.tz').addEventListener('input', () => { q('.tzs').value = { 5.5: 'ist' }[parseFloat(q('.tz').value)] || 'auto'; });
  q('.sug').addEventListener('click', (e) => {
    const d = e.target.closest('[data-i]'); if (!d) return;
    const p = q('.sug')._r[d.dataset.i];
    chosen = { label: placeLabel(p), lat: p[4], lon: p[5], tzid: p[6] };
    q('.pl').value = chosen.label; q('.sug').hidden = true;
    q('.la').value = p[4]; q('.lo').value = p[5];
  });
  const read = () => ({ name: q('.nm').value.trim(), date: q('.dt').value, time: q('.tm').value, place: q('.pl').value.trim(), chosen, lat: q('.la').value, lon: q('.lo').value, tz: q('.tz').value });
  const fill = (p) => { q('.nm').value = p.name; q('.dt').value = p.date; q('.tm').value = p.time; q('.pl').value = p.place; chosen = p.chosen; q('.la').value = p.lat; q('.lo').value = p.lon; q('.tz').value = p.tz; q('.tz').dispatchEvent(new Event('input')); };
  q('.sv').onclick = () => { const p = read(); if (!p.name || !p.date) return toast(t('need')); store.set('people', [...people().filter((x) => !(x.name === p.name && x.date === p.date)), p]); refresh(); };
  q('.ld').onchange = () => { const p = people()[q('.ld').value]; if (p) fill(p); };
  q('.dl').onclick = () => { const i = q('.ld').value; if (i === '') return; store.set('people', people().filter((_, j) => j != i)); refresh(); };
  return {
    read,
    /** Build a Chart from the form, or null when incomplete. */
    chart() {
      const p = read();
      if (!p.date || !p.time) return null;
      const [y, mo, d] = p.date.split('-').map(Number), [h, mi] = p.time.split(':').map(Number);
      const local = { y, mo, d, h, mi };
      const lat = parseFloat(p.lat), lon = parseFloat(p.lon);
      if (isNaN(lat) || isNaN(lon)) return null;
      let tz = parseFloat(p.tz);
      if (isNaN(tz)) tz = p.chosen?.tzid ? V.tzOffset(p.chosen.tzid, local) : settings.default_tz;
      return { name: p.name, chart: V.makeChart(local, tz, lat, lon, eff(), p.chosen?.label || p.place) };
    },
  };
}

// ---- PDF export through Android's print service ("Save as PDF"); browser print as a fallback
const PRINT_PX = { small: 10, medium: 11, large: 12.5 };
function exportPdf(html, title) {
  if (!paid) return showBuy();
  const css = `@page{size:${settings.paper === 'Letter' ? 'letter' : 'A4'};margin:10mm}body{margin:0}.rp{--fs:${PRINT_PX[settings.font_size]}px!important}.rp td,.rp th{padding:2px 5px}.rp table.chart td{height:40px}.rp h1{font-size:1.5em}.rp .hd img{width:15mm;height:15mm}.rp h2{margin:8px 0 4px}`;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>${V.REPORT_CSS}${css}</style></head><body>${html}</body></html>`;
  const job = title.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 40) || 'jathagam';
  if (window.Android?.printHtml) window.Android.printHtml(doc, job, settings.paper);
  else { const w = open('', '_blank'); w.document.write(doc); w.document.close(); w.print(); }
}

// ---- settings screen, generated from V.SCHEMA
function settingsScreen() {
  const root = $('#f-set'), ta = settings.ui_lang === 'ta';
  const field = (it) => {
    const label = `<label>${esc(ta ? it.ta : it.en)}</label>`, hint = it.hint ? `<div class=hint>${esc(it.hint)}</div>` : '';
    const v = settings[it.k], dis = !paid && LOCKED.has(it.k) ? 'disabled' : '';
    if (it.type === 'select') return `${label}<select data-k="${it.k}">${it.opts.map((o, n) => `<option value="${o}" ${String(v) === String(o) ? 'selected' : ''}>${esc(it.optLabels ? it.optLabels[n] : String(o).replace(/_/g, ' '))}</option>`).join('')}</select>${hint}`;
    if (it.type === 'number') return `${label}<input type=number data-k="${it.k}" value="${v}" min="${it.min}" max="${it.max}" step="${it.step}">${hint}`;
    if (it.type === 'bool') return `<div class=chk><label><input type=checkbox data-k="${it.k}" ${dis} ${v ? 'checked' : ''}>${esc(ta ? it.ta : it.en)}</label></div>`;
    if (it.type === 'text') return `${label}<input data-k="${it.k}" ${dis} value="${esc(v)}" maxlength="${it.max}" ${it.k === 'shop_phone' ? 'inputmode=tel' : ''}>${hint}`;
    return `${label}<div class=chk>${it.opts.map((o) => `<label><input type=checkbox data-m="${it.k}" value="${o}" ${v.includes(o) ? 'checked' : ''}>${esc(String(o).replace(/_/g, ' '))}</label>`).join('')}</div>`;
  };
  const open = new Set([...root.querySelectorAll('details[open]')].map((d) => d.dataset.s));
  const logoBox = `<details data-s=logo ${paid ? '' : 'open'}><summary>${ta ? 'லோகோ' : 'Logo'}</summary><fieldset>${paid
    ? `<input type=file id=logofile accept="image/*"><button class="act alt" id=logoclr type=button>${ta ? 'லோகோவை நீக்கு' : 'Remove logo'}</button>`
    : `<div class=hint>${t('buyMsg')}</div><button class=act id=buynow type=button>${t('buy')}</button>`}</fieldset></details>`;
  root.innerHTML = logoBox + Object.entries(V.SECTIONS).map(([sec, [en, tam]]) => `<details data-s="${sec}" ${open.has(sec) || (!open.size && sec === 'calc') ? 'open' : ''}><summary>${esc(ta ? tam : en)}</summary><fieldset>${V.SCHEMA.filter((i) => i.sec === sec).map(field).join('')}</fieldset></details>`).join('') +
    `<details data-s=backup><summary>${t('backup')}</summary><fieldset><button class="act alt" id=exp type=button>${t('exp')}</button><label>${t('paste')}</label><textarea id=impbox rows=6></textarea><button class="act alt" id=imp type=button>${t('imp')}</button></fieldset></details>
    <button class="act alt" id=rst>${t('reset')}</button>`;
  const apply = (s, rebuild) => {
    try { settings = V.makeSettings(s); store.set('settings', settings); } catch (err) { toast(err.message); settingsScreen(); return; }
    if (rebuild) applyLang();
  };
  root.onchange = (e) => {
    const el = e.target, s = { ...settings };
    if (el.dataset.k) s[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.m) s[el.dataset.m] = [...root.querySelectorAll(`[data-m="${el.dataset.m}"]:checked`)].map((x) => x.value);
    apply(s, ['ui_lang', 'icon_jath', 'icon_match', 'icon_set', 'shop_name_ta', 'shop_name_en', 'shop_phone', 'phone_icon'].includes(el.dataset.k));
  };
  $('#rst').onclick = () => apply({}, true);
  if ($('#buynow')) $('#buynow').onclick = () => buy();
  if ($('#logofile')) $('#logofile').onchange = (ev) => readLogo(ev.target.files[0]);
  if ($('#logoclr')) $('#logoclr').onclick = () => { customLogo = null; store.set('logo', null); syncLogo(); toast(t('ok')); };
  $('#exp').onclick = () => { $('#impbox').value = JSON.stringify(settings, null, 1); $('#impbox').select(); try { navigator.clipboard?.writeText($('#impbox').value); } catch {} };
  $('#imp').onclick = () => {
    try { settings = V.makeSettings(JSON.parse($('#impbox').value)); store.set('settings', settings); applyLang(); toast(t('ok')); } catch (err) { toast(t('bad') + err.message); }
  };
}

let forms = {};
function applyLang() {
  document.documentElement.lang = settings.ui_lang;
  const e = eff();
  $('#hname').textContent = (settings.ui_lang === 'ta' ? e.shop_name_ta : e.shop_name_en) || 'கணியன்';
  $('#hphone').textContent = e.shop_phone ? `${e.phone_icon} ${e.shop_phone}`.trim() : '';
  document.title = $('#hname').textContent;
  syncLogo();
  const nav = document.querySelectorAll('nav button');
  nav[0].textContent = `${settings.icon_jath} ${t('jath')}`.trim(); nav[1].textContent = `${settings.icon_match} ${t('match')}`.trim(); nav[2].textContent = `${settings.icon_set} ${t('set')}`.trim();
  $('#go-jath').textContent = t('go'); $('#go-match').textContent = t('gom'); $('#pdf-jath').textContent = '📄 ' + t('pdf'); $('#pdf-match').textContent = '📄 ' + t('pdf');
  forms = {
    jath: birthForm($('#f-jath'), 'j', t('jath')),
    girl: birthForm($('#f-girl'), 'g', t('girl')),
    boy: birthForm($('#f-boy'), 'b', t('boy')),
  };
  settingsScreen();
}

let last = { jath: null, match: null };
function wire() {
  document.querySelectorAll('nav button').forEach((b) => (b.onclick = () => {
    document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('on', x === b));
    document.querySelectorAll('.tab').forEach((s) => s.classList.toggle('on', s.id === 't-' + b.dataset.t));
    scrollTo(0, 0);
  }));
  $('#go-jath').onclick = () => {
    const r = forms.jath.chart(); if (!r) return toast(t('need'));
    const html = V.jathagamHtml(r.chart, r.name);
    last.jath = { html, title: 'Jathagam_' + r.name };
    $('#res1').innerHTML = html; $('#out1').hidden = false; $('#out1').scrollIntoView();
  };
  $('#go-match').onclick = () => {
    const g = forms.girl.chart(), b = forms.boy.chart(); if (!g || !b) return toast(t('need'));
    const html = V.poruthamHtml(g.chart, b.chart, [g.name, b.name], eff());
    last.match = { html, title: `Porutham_${g.name}_${b.name}` };
    $('#res2').innerHTML = html; $('#out2').hidden = false; $('#out2').scrollIntoView();
  };
  $('#pdf-jath').onclick = () => last.jath && exportPdf(last.jath.html, last.jath.title);
  $('#pdf-match').onclick = () => last.match && exportPdf(last.match.html, last.match.title);
}

// ---- purchase (Google Play Billing, handled in MainActivity)
function buy() { if (window.Android?.buy) window.Android.buy(); else toast(t('nobuy')); }
function showBuy() {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:30;background:rgba(0,0,0,.5);display:flex;align-items:center;padding:20px';
  ov.innerHTML = `<div style="background:#fff;border-radius:14px;padding:18px;max-width:420px;margin:auto"><p style="margin:0 0 12px">${t('buyMsg')}</p><button class=act id=bb>${t('buy')}</button><button class="act alt" id=bl>${t('later')}</button></div>`;
  $('#bb', ov).onclick = () => { ov.remove(); buy(); };
  $('#bl', ov).onclick = () => ov.remove();
  document.body.append(ov);
}
// a custom logo is shrunk to 192px so it stays small in storage and in every report
function readLogo(file) {
  if (!file) return;
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const k = Math.min(1, 192 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    customLogo = c.toDataURL('image/png'); store.set('logo', customLogo); URL.revokeObjectURL(url); syncLogo(); toast(t('ok'));
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast(t('bad')); };
  img.src = url;
}

// ---- first-run setup: the user enters their own business details (all optional, editable later in Settings)
function setupScreen(full = paid) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:20;background:var(--bg);overflow:auto;padding:20px 16px';
  const draw = () => {
    const ta = settings.ui_lang === 'ta';
    const L = ta
      ? { h: 'வரவேற்கிறோம்', p: 'உங்கள் விவரங்களை உள்ளிடவும். இவை ஜாதக அறிக்கையின் தலைப்பிலும் அடிக்குறிப்பிலும் வரும். பின்னர் அமைப்புகளில் மாற்றலாம்.', lang: 'செயலி மொழி', en: 'நிறுவனப் பெயர் (ஆங்கிலம்)', ta: 'நிறுவனப் பெயர் (தமிழ்)', ph: 'தொலைபேசி', ad: 'முகவரி (விருப்பம்)', ok: 'சேமி', skip: 'தவிர்' }
      : { h: 'Welcome', p: 'Enter your details. They appear in the header and footer of every report. You can change them later in Settings.', lang: 'App language', en: 'Business / astrologer name (English)', ta: 'Business name (Tamil, optional)', ph: 'Phone (optional)', ad: 'Address (optional)', ok: 'Save', skip: 'Skip' };
    ov.innerHTML = `<main><h2 style="color:var(--c)">${L.h}</h2><p>${L.p}</p>
      <label>${L.lang}</label><select id=su-lang><option value=ta ${ta ? 'selected' : ''}>தமிழ்</option><option value=en ${ta ? '' : 'selected'}>English</option></select>
      ${full ? `<label>${L.en}</label><input id=su-en maxlength=80 value="${esc(settings.shop_name_en)}">
      <label>${L.ta}</label><input id=su-ta maxlength=80 value="${esc(settings.shop_name_ta)}">
      <label>${L.ph}</label><input id=su-ph maxlength=40 inputmode=tel value="${esc(settings.shop_phone)}">
      <label>${L.ad}</label><input id=su-ad maxlength=120 value="${esc(settings.shop_address)}">` : `<p><b>${t('buyMsg')}</b></p>`}
      <button class=act id=su-ok>${full ? L.ok : t('cont')}</button>${full ? `<button class="act alt" id=su-skip>${L.skip}</button>` : ''}</main>`;
    const read = () => ({ ui_lang: $('#su-lang', ov).value, ...(full ? { shop_name_en: $('#su-en', ov).value.trim(), shop_name_ta: $('#su-ta', ov).value.trim(), shop_phone: $('#su-ph', ov).value.trim(), shop_address: $('#su-ad', ov).value.trim() } : {}) });
    $('#su-lang', ov).onchange = () => { settings = V.makeSettings({ ...settings, ...read() }); draw(); };
    const done = (save) => {
      if (save) {
        const s = read();
        if (full && !s.shop_name_en) s.shop_name_en = s.shop_name_ta;   // one name is enough: use it for both languages
        if (!s.shop_name_ta) s.shop_name_ta = s.shop_name_en;
        settings = V.makeSettings({ ...settings, ...s });
        store.set('settings', settings);
      }
      store.set('setup_done', true); if (full) store.set('details_done', true); ov.remove(); applyLang();
    };
    $('#su-ok', ov).onclick = () => done(true);
    if (full) $('#su-skip', ov).onclick = () => done(false);
  };
  draw(); document.body.append(ov);
}

(async () => {
  applyLang();
  if (!store.get('setup_done', false)) setupScreen(paid);
  else if (paid && !store.get('details_done', false)) setupScreen(true);
  $('#status').textContent = t('loading');
  await Promise.all([V.initEngine(), loadPlaces()]);
  $('#status').remove();
  wire();
  window.__ready = true;
})().catch((e) => { $('#status').textContent = 'Error: ' + e.message; });
