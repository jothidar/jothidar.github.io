// Prepares a Tamil porutham report in the running app and opens Android's print sheet for it.
const page = (await (await fetch('http://localhost:9222/json')).json()).find((p) => p.type === 'page' && p.url.includes('index.html'));
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); pend.get(d.id)?.(d); };
const ev = (expression) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true, userGesture: true } })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fill = (root, sel, v) => `(()=>{const e=document.querySelector('${root} ${sel}');e.value=${JSON.stringify(v)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`;
const pick = async (root, text) => { await ev(fill(root, '.pl', text)); await sleep(300); await ev(`document.querySelector('${root} .sug div[data-i="0"]').click()`); };
await ev("localStorage.clear();location.reload()"); await sleep(6000);
await ev("document.querySelector('[data-t=match]').click()");
await pick('#f-girl', 'chennai'); await ev(fill('#f-girl', '.nm', 'பெண்')); await ev(fill('#f-girl', '.dt', '1995-03-04')); await ev(fill('#f-girl', '.tm', '10:00'));
await pick('#f-boy', 'kovilpatti'); await ev(fill('#f-boy', '.nm', 'ஆண்')); await ev(fill('#f-boy', '.dt', '1992-07-08')); await ev(fill('#f-boy', '.tm', '22:30'));
await ev("document.querySelector('#go-match').click()"); await sleep(800);
console.log('charts:', (await ev("document.querySelectorAll('#res2 table.chart').length")).result.result.value);
await ev("document.querySelector('#pdf-match').click()"); await sleep(500);
process.exit(0);
