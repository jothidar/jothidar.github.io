const page = (await (await fetch('http://localhost:9222/json')).json()).find((p) => p.type === 'page' && p.url.includes('index.html'));
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
ws.onmessage = () => {};
const expr = process.argv[2];
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, userGesture: true } }));
setTimeout(() => process.exit(0), 800);
