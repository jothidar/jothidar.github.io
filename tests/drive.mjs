// Drives the app inside the emulator's WebView over the DevTools protocol (debug build, adb-forwarded port 9222).
const page = (await (await fetch('http://localhost:9222/json')).json()).find((p) => p.type === 'page' && p.url.includes('index.html'));
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); pend.get(d.id)?.(d); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra = '') => { console.log(ok ? 'PASS' : 'FAIL', name, extra); if (!ok) fails++; };

check('engine ready', await ev('window.__ready === true'));
const fill = (root, sel, v) => `(()=>{const e=document.querySelector('${root} ${sel}');e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`;
const pick = async (root, text) => {
  await ev(fill(root, '.pl', text)); await sleep(300);
  const label = await ev(`document.querySelector('${root} .sug div[data-i="0"]')?.textContent || null`);
  await ev(`document.querySelector('${root} .sug div[data-i="0"]').click()`);
  return label;
};

// --- jathagam with place-name search
const sug = await pick('#f-jath', 'madurai');
check('place search finds Madurai (Tamil label)', sug && sug.includes('மதுரை'), sug);
check('lat/lon filled from place', Math.abs(+(await ev("document.querySelector('#f-jath .la').value")) - 9.919) < 0.01);
await ev(fill('#f-jath', '.nm', 'சோதனை')); await ev(fill('#f-jath', '.dt', '1990-01-01')); await ev(fill('#f-jath', '.tm', '06:00'));
await ev("document.querySelector('#go-jath').click()"); await sleep(800);
const j = await ev("document.querySelector('#res1').innerText");
check('jathagam shows place name, not coordinates', j.includes('மதுரை') && !/9\.91/.test(j), '');
check('lagna emoji', j.includes('⭐'));
check('Tamil panchanga (tithi/yoga/karana)', j.includes('சதுர்த்தி') && j.includes('வஜ்ரம்') && j.includes('பத்திரை'));
check('Dhanishta moon star + Sagittarius lagna', j.includes('அவிட்டம்') && j.includes('தனுசு'));
check('2 charts in jathagam', (await ev("document.querySelectorAll('#res1 table.chart').length")) === 2);
check('tz auto = IST (UTC+5.5) with UTC equivalent', j.includes('IST (UTC+5.5)') && j.includes('00:30 UTC'));
check('footer name+phone in report', j.includes('1234567890'));

// --- time zone quick choice: IST only (no UTC+0 preset)
check('tz selector offers Auto and IST only', (await ev("[...document.querySelectorAll('#f-jath .tzs option')].map(o=>o.value).join()")) === 'auto,ist');
await ev("(()=>{const e=document.querySelector('#f-jath .tzs');e.value='ist';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
check('IST preset fills 5.5', (await ev("document.querySelector('#f-jath .tz').value")) === '5.5');
await ev("document.querySelector('#go-jath').click()"); await sleep(500);
check('report shows IST and its UTC equivalent', (await ev("document.querySelector('#res1').innerText")).includes('IST (UTC+5.5) = 00:30 UTC'));
await ev("(()=>{const e=document.querySelector('#f-jath .tzs');e.value='auto';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
// --- historical timezone: India 1943 (war time +6:30) must differ from the modern +5.5
await ev(fill('#f-jath', '.dt', '1943-06-15'));
await ev("document.querySelector('#go-jath').click()"); await sleep(600);
const h = await ev("document.querySelector('#res1').innerText");
check('historical tz applied (1943 not UTC+5.5)', !h.includes('UTC+5.5'), (h.match(/UTC[+-][\d.]+/) || [''])[0]);
await ev(fill('#f-jath', '.dt', '1990-01-01'));

// --- porutham: both jathagams, 4 charts
await pick('#f-girl', 'chennai'); await ev(fill('#f-girl', '.nm', 'பெண்')); await ev(fill('#f-girl', '.dt', '1995-03-04')); await ev(fill('#f-girl', '.tm', '10:00'));
await pick('#f-boy', 'kovilpatti'); await ev(fill('#f-boy', '.nm', 'ஆண்')); await ev(fill('#f-boy', '.dt', '1992-07-08')); await ev(fill('#f-boy', '.tm', '22:30'));
await ev("document.querySelector('#go-match').click()"); await sleep(800);
const m = await ev("document.querySelector('#res2').innerText");
check('4 charts in porutham', (await ev("document.querySelectorAll('#res2 table.chart').length")) === 4);
check('10 poruthams listed', (await ev("document.querySelectorAll('#res2 h2 + table tr').length")) === 11);
check('both places named', m.includes('சென்னை') && m.includes('கோவில்பட்டி'));
check('score matches python (7 / 10)', m.includes('7 / 10'), (m.match(/\d+ \/ \d+/) || [''])[0]);

// --- settings: tradition change takes effect
await ev("(()=>{const e=document.querySelector('#f-set [data-k=ayanamsa]');e.value='raman';e.dispatchEvent(new Event('change',{bubbles:true}))})()");
await ev("(()=>{const e=document.querySelector('#f-set [data-m=poruthams][value=vasya]');e.checked=false;e.dispatchEvent(new Event('change',{bubbles:true}))})()");
check('settings persisted', (await ev("JSON.parse(localStorage.getItem('settings')).ayanamsa")) === 'raman');
await ev("document.querySelector('#go-match').click()"); await sleep(600);
const m2 = await ev("document.querySelector('#res2').innerText");
check('porutham list honours disabled vasya (9 rows)', (await ev("document.querySelectorAll('#res2 h2 + table tr').length")) === 10 && m2.includes('/ 9'));
await ev("document.querySelector('#go-jath').click()"); await sleep(600);
check('jathagam uses raman', (await ev("document.querySelector('#res1').innerText")).includes('raman'));

// --- settings screen is generated from the schema; every setting is reachable
const nSchema = await ev("(async()=>{const V=await import('./vedic.js');return V.SCHEMA.length})()");
const nCtl = await ev("new Set([...document.querySelectorAll('#f-set [data-k],#f-set [data-m]')].map(e=>e.dataset.k||e.dataset.m)).size");
check('settings screen has a control for every schema item', nCtl === nSchema, `${nCtl}/${nSchema}`);
const setK = (k, v) => ev(`(()=>{const e=document.querySelector('#f-set [data-k=${k}]');if(e.type==='checkbox')e.checked=${JSON.stringify(v)};else e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
await setK('chart_style', 'north'); await setK('date_format', 'long'); await setK('time_format', '12h'); await setK('show_verdict', true); await setK('lagna_marker', '🔱');
await ev("document.querySelector('#go-match').click()"); await sleep(600);
const m3 = await ev("document.querySelector('#res2').innerHTML");
check('north charts x4 in porutham', (m3.match(/<svg class="nc"/g) || []).length === 4);
check('verdict shown, 12h/long date, custom marker', m3.includes('class="verdict') && m3.includes('Mar 1995') && /AM|PM/.test(m3) && m3.includes('🔱'));
await setK('antar_for', 'all');
await ev("document.querySelector('#go-jath').click()"); await sleep(600);
check('antar_for all -> 9 bhukti tables', (await ev("document.querySelectorAll('#res1 h3').length")) === 9);
// backup / restore
await ev("document.querySelector('#exp').click()");
const dump = await ev("document.querySelector('#impbox').value");
check('export shows JSON of current settings', JSON.parse(dump).chart_style === 'north');
await ev("document.querySelector('#rst').click()"); await sleep(300);
check('reset restores defaults', (await ev("JSON.parse(localStorage.getItem('settings')).chart_style")) === 'south');
await ev(`(()=>{document.querySelector('#impbox').value=${JSON.stringify(dump)};document.querySelector('#imp').click()})()`); await sleep(300);
check('import restores backup', (await ev("JSON.parse(localStorage.getItem('settings')).chart_style")) === 'north');
await setK('icon_match', '🤝');
check('tab icon customisable', (await ev("document.querySelectorAll('nav button')[1].textContent")).startsWith('🤝'));
await ev("document.querySelector('#rst').click()"); await sleep(300);
check('default tab icon is 💍 (not 💑)', (await ev("document.querySelectorAll('nav button')[1].textContent")).startsWith('💍'));
// --- app language is separate from report language
await setK('ui_lang', 'en');
check('english UI header', (await ev("document.querySelector('#hname').textContent")) === 'Test Shop');
await ev("document.querySelector('#go-jath').click()");
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
ws.close(); process.exit(fails ? 1 : 0);
