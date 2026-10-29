// Prints JSON for fixed births using the JS engine; compare.py checks it against the Python package.
import * as V from '../web-src/vedic.js';
await V.initEngine();
const out = [];
const cases = [
  [{ y: 1990, mo: 1, d: 1, h: 6, mi: 0 }, 5.5, 13.0827, 80.2707, {}],
  [{ y: 1995, mo: 3, d: 4, h: 10, mi: 0 }, 5.5, 13, 80, { ayanamsa: 'raman', node: 'true', dasa_depth: 3 }],
  [{ y: 1985, mo: 5, d: 5, h: 12, mi: 30 }, 5.5, 9.9252, 78.1198, { house_system: 'placidus', dasa_year: 'savana', day_starts: 'midnight' }],
];
for (const [l, tz, lat, lon, over] of cases) {
  const c = V.makeChart(l, tz, lat, lon, V.makeSettings(over));
  const pan = V.panchanga(c), d = V.dasas(c);
  out.push({ planets: c.planets, lagna: c.lagna, houses: Object.fromEntries(Object.entries(c.planets).map(([k, v]) => [k, V.house(c, v)])),
    pan: { ...pan, sunrise: pan.sunrise && new Date(pan.sunrise).toISOString().slice(11, 16), sunset: pan.sunset && new Date(pan.sunset).toISOString().slice(11, 16) },
    dasa: d.map((m) => [m.lord, new Date(m.start).toISOString().slice(0, 10), new Date(m.end).toISOString().slice(0, 10), m.sub.length, m.sub[0]?.sub.length ?? 0]),
    nav: Object.fromEntries(Object.entries(c.planets).map(([k, v]) => [k, V.navamsa(v)])) });
}
const st = V.makeSettings({});
out.push([[0, 0, 0, 0], [0, 0, 17, 7], [13, 0, 25, 0], [5, 3, 22, 9], [10, 11, 3, 4]].map((a) => V.match(...a, st)));
console.log(JSON.stringify(out));
