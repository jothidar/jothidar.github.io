// Engine-level tests for every customisation (runs in Node, no device needed).
import * as V from '../web-src/vedic.js';
await V.initEngine();
let fails = 0;
const check = (n, ok, x = '') => { console.log(ok ? 'PASS' : 'FAIL', n, x); if (!ok) fails++; };
const B = [{ y: 1990, mo: 1, d: 1, h: 6, mi: 0 }, 5.5, 13.0827, 80.2707];
const BRAND = { shop_name_ta: 'Test Shop', shop_name_en: 'Test Shop', shop_phone: '1234567890' };
const mk = (over = {}, b = B) => V.makeChart(...b, V.makeSettings({ ...BRAND, ...over }));
const html = (over = {}, name = 'T') => V.jathagamHtml(mk(over), name, Date.UTC(2026, 9, 23));
const text = (h) => h.replace(/<[^>]+>/g, ' ');
const base = mk();

// --- odd historical offsets and short years must not print raw decimals (reported: "26-09-199 16:13 (UTC+5.891111111111111)")
{
  const old = V.makeChart({ y: 199, mo: 9, d: 26, h: 16, mi: 13 }, 5.891111111111111, 22.5726, 88.3639, V.makeSettings(BRAND));
  const t = text(V.jathagamHtml(old, 'T', Date.UTC(2026, 9, 23)));
  check('year is 4 digits', t.includes('26-09-0199'), t.match(/\d\d-\d\d-\d+ \d\d:\d\d[^=]*/)?.[0]);
  check('odd offset shown as h:mm', t.includes('UTC+5:53') && !/5\.8911/.test(t));
  check('ordinary offset unchanged', text(html()).includes('(UTC+5.5)'));
  const west = V.makeChart(...[{ y: 1990, mo: 1, d: 1, h: 6, mi: 0 }, -3.5, 47.5, -52.7], V.makeSettings(BRAND));
  check('negative offset unchanged', text(V.jathagamHtml(west, 'T', Date.UTC(2026, 9, 23))).includes('(UTC-3.5)'));
}

// --- schema / validation
check('defaults valid', V.makeSettings().ayanamsa === 'lahiri' && V.makeSettings().poruthams.length === 10);
for (const bad of [{ ayanamsa: 'nope' }, { accent: 'red' }, { node: 'x' }, { chart_style: 'round' }, { default_tz: 'abc' }]) {
  let threw = false; try { V.makeSettings(bad); } catch { threw = true; }
  check('rejects ' + JSON.stringify(bad), threw);
}
check('numbers clamp', V.makeSettings({ default_tz: 99 }).default_tz === 14 && V.makeSettings({ min_pass: -3 }).min_pass === 0);
check('strings from json backup round-trip', JSON.stringify(V.makeSettings(JSON.parse(JSON.stringify(V.makeSettings({ ayanamsa: 'raman', poruthams: ['dina'] }))))) === JSON.stringify(V.makeSettings({ ayanamsa: 'raman', poruthams: ['dina'] })));
check('unknown keys dropped', !('zzz' in V.makeSettings({ zzz: 1 })));

// --- every ayanamsa gives a distinct, plausible sidereal Sun (lahiri ~256.6)
const sun = {};
for (const a of V.SCHEMA.find((i) => i.k === 'ayanamsa').opts) sun[a] = mk({ ayanamsa: a }).planets.Sun;
check('all 21 ayanamsas compute', Object.values(sun).every((x) => x >= 0 && x < 360) && Object.keys(sun).length === 21, Object.keys(sun).length);
check('lahiri vs raman ~1.4 deg', Math.abs(sun.lahiri - sun.raman) > 1 && Math.abs(sun.lahiri - sun.raman) < 2);

// --- fine-tune shifts everything by exactly that amount (planets, lagna, cusps)
const adj = mk({ ayanamsa_adjust: 0.5, house_system: 'equal' }), eq = mk({ house_system: 'equal' });
const d = (x, y) => ((x - y + 540) % 360) - 180;
check('adjust shifts planets/lagna/cusps by -0.5', Object.keys(adj.planets).every((k) => Math.abs(d(eq.planets[k], adj.planets[k]) - 0.5) < 1e-6) && Math.abs(d(eq.lagna, adj.lagna) - 0.5) < 1e-6 && Math.abs(d(eq.cusps[3], adj.cusps[3]) - 0.5) < 1e-6);

// --- house systems differ in cusps; whole sign keeps sign houses
const cusp = (h) => mk({ house_system: h }).cusps[1];      // cusp 2 (cusp 10 is the MC in several systems)
const systems = V.SCHEMA.find((i) => i.k === 'house_system').opts;
check('all 11 house systems compute', systems.every((h) => mk({ house_system: h }).cusps.length === 12 && mk({ house_system: h }).cusps.every(Number.isFinite)));
check('placidus != koch != equal cusps', cusp('placidus') !== cusp('koch') && cusp('koch') !== cusp('equal'));
check('house() 1..12 for every system', systems.every((h) => { const c = mk({ house_system: h }); return Object.values(c.planets).every((x) => { const n = V.house(c, x); return n >= 1 && n <= 12; }); }));

// --- sunrise definition moves the time by minutes
const rise = (m) => V.panchanga(mk({ sunrise_mode: m })).sunrise;
check('upper_limb earlier than disc_center earlier than geometric', rise('upper_limb') < rise('disc_center') && rise('disc_center') < rise('geometric'), [rise('upper_limb'), rise('disc_center'), rise('geometric')].map((x) => (x - rise('upper_limb')) / 1000 + 's').join(' '));
check('midnight vs sunrise changes vara', V.panchanga(mk({ day_starts: 'midnight' })).vara !== V.panchanga(base).vara);

// --- dasa
const yr = (o) => { const m = V.dasas(mk(o))[1]; return (m.end - m.start) / 86400000; };
check('dasa year lengths 18y', Math.abs(yr({}) - 18 * 365.25) < 1e-6 && Math.abs(yr({ dasa_year: 'savana' }) - 18 * 360) < 1e-6 && Math.abs(yr({ dasa_year: 'sidereal' }) - 18 * 365.25636) < 1e-6 && Math.abs(yr({ dasa_year: 'tropical' }) - 18 * 365.2422) < 1e-6);
check('dasa depth 1/2/3', V.dasas(mk({ dasa_depth: 1 }))[1].sub.length === 0 && V.dasas(mk({ dasa_depth: 3 }))[1].sub[0].sub.length === 9);
check('antar none/running/all', !html({ antar_for: 'none' }).includes('<h3>') && html({ antar_for: 'running' }).includes('<h3>') === false && (html({ antar_for: 'all' }).match(/<h3>/g) || []).length >= 8);

// --- report sections, columns, formats, charts
const h0 = html();
check('default report has all parts', h0.includes('table class=chart') && /இடம்/.test(h0) && h0.includes('⭐') && h0.includes('1234567890'));
check('hide panchanga/planets/dasa', !html({ show_panchanga: false }).includes('பஞ்சாங்கம்') && !html({ show_planets: false }).includes('<th>') && !html({ show_dasa: false }).includes('விம்சோத்தரி'));
check('columns toggle', !html({ col_bhava: false }).includes('பாவம்') && html({ col_navamsa: true }).includes('நவாம்சம்</th>') && !html({ col_dignity: false }).includes('நிலை</th>'));
check('lagna row adds a row', (html({ show_lagna_row: true }).match(/<tr>/g) || []).length === (h0.match(/<tr>/g) || []).length + 1);
check('hide nodes removes Rahu/Ketu from table and charts', !text(html({ show_nodes: false, show_dasa: false })).includes('ராகு') && !html({ show_nodes: false }).includes('>ரா<') && text(html({ show_dasa: false })).includes('ராகு'));
check('degree format dms', /\d+°\d\d′/.test(html({ deg_format: 'dms' })) && !/16\.6\d°/.test(html({ deg_format: 'dms' })));
check('date formats', html({ date_format: 'dmy_slash' }).includes('01/01/1990') && html({ date_format: 'ymd' }).includes('1990-01-01') && html({ date_format: 'long' }).includes('01 Jan 1990') && h0.includes('01-01-1990'));
check('12h time', html({ time_format: '12h' }).includes('6:00 AM') && h0.includes('06:00'));
check('north chart = svg, 2 of them', (html({ chart_style: 'north' }).match(/<svg class=nc/g) || []).length === 2 && !html({ chart_style: 'north' }).includes('table class=chart'));
check('north chart puts lagna sign in house 1 (Sagittarius = 9)', /<text x="100" y="[\d.]+" text-anchor="middle" font-size="9" fill="#888">9<\/text>/.test(html({ chart_style: 'north' })));
check('chart toggles', (html({ show_navamsa_chart: false }).match(/table class=chart/g) || []).length === 1 && !html({ show_rasi_chart: false, show_navamsa_chart: false }).includes('class=chart'));
check('planet_label full', html({ planet_label: 'full' }).includes('சூரியன் சனி') || html({ planet_label: 'full' }).includes('சந்திரன்'));
check('lagna marker custom/empty', html({ lagna_marker: '🔱' }).includes('🔱 லக்') && !html({ lagna_marker: '' }).includes('⭐'));
check('English report', html({ lang: 'en' }).includes('Jathagam') && html({ lang: 'en' }).includes('Test Shop'));

// --- zone names and UTC equivalent
check('IST label + UTC equivalent', h0.includes('IST (UTC+5.5)') && h0.includes('= 00:30 UTC<') || h0.includes('= 00:30 UTC '), (h0.match(/\d\d:\d\d IST[^<]*/) || [''])[0]);
check('UTC date shown when it differs (02:00 IST = 20:30 UTC previous day)', V.jathagamHtml(V.makeChart(...[{ y: 1990, mo: 1, d: 1, h: 2, mi: 0 }, 5.5, 13, 80], V.makeSettings()), 'T', 0).includes('= 20:30 UTC (31-12-1989)'));
check('show_utc off hides the equivalent', !html({ show_utc: false }).includes('= 00:30 UTC') && html({ show_utc: false }).includes('IST (UTC+5.5)'));
const zeroChart = V.jathagamHtml(V.makeChart(...[{ y: 1990, mo: 1, d: 1, h: 6, mi: 0 }, 0, 13, 80], V.makeSettings()), 'T', 0);
check('UTC+0 gets no zone name and no duplicate equivalent', zeroChart.includes('06:00 (UTC+0)') && !zeroChart.includes('UTC (UTC') && !zeroChart.includes('= 06:00 UTC'));
check('other zones: offset only', !html({}).includes('IST IST') && V.jathagamHtml(V.makeChart(...[{ y: 1943, mo: 6, d: 15, h: 6, mi: 0 }, 6.5, 13, 80], V.makeSettings()), 'T', 0).includes('(UTC+6.5)'));

// --- branding
const br = html({ show_logo: false, shop_address: '12 Temple St', show_footer: false, footer_note: 'Thank you', accent: '#112233', font_size: 'large' });
check('logo off / address / footer note / accent / font', !br.includes('<img') && br.includes('12 Temple St') && br.includes('Thank you') && !br.includes('class=foot><') === false && br.includes('--acc:#112233') && br.includes('--fs:15px'));
check('footer off keeps phone in header only', (br.match(/1234567890/g) || []).length === 1);
check('shop name/phone editable', html({ shop_name_ta: 'எனது கடை', shop_phone: '1234' }).includes('எனது கடை') && html({ shop_phone: '' }).indexOf('📱') === -1);
check('phone icon: default 📱 (not the red ☎), custom, empty', h0.includes('📱 1234567890') && !h0.includes('☎') && html({ phone_icon: '📞' }).includes('📞 1234567890') && html({ phone_icon: '' }).includes('<div>1234567890</div>'));

// --- porutham
const G = [{ y: 1995, mo: 3, d: 4, h: 10, mi: 0 }, 5.5, 13, 80], Bo = [{ y: 1992, mo: 7, d: 8, h: 22, mi: 30 }, 5.5, 13, 80];
const pm = (o = {}) => { const s = V.makeSettings(o); return V.poruthamHtml(V.makeChart(...G, s), V.makeChart(...Bo, s), ['A', 'B'], s); };
const base7 = pm();
check('default 7 / 10 (matches python)', base7.includes('7 / 10'));
check('4 charts (south) / 4 svgs (north)', (base7.match(/table class=chart/g) || []).length === 4 && (pm({ chart_style: 'north' }).match(/<svg class=nc/g) || []).length === 4);
check('porutham subset', pm({ poruthams: ['dina', 'gana'] }).includes('/ 2'));
check('verdict off by default, on works', !base7.includes('verdict') && pm({ show_verdict: true }).includes('verdict'));
check('verdict: 7>=6 and rajju+vedha pass -> recommended', pm({ show_verdict: true }).includes('பொருத்தம் உண்டு'));
check('verdict: min_pass 9 -> not recommended', pm({ show_verdict: true, min_pass: 9 }).includes('பொருத்தம் இல்லை'));
check('verdict: must-pass dina (fails) -> not recommended + names it', /verdict no[^]*தினப் பொருத்தம்/.test(pm({ show_verdict: true, must_pass: ['dina'] })));
check('vasya either direction can only add passes', (pm({ vasya_direction: 'either' }).match(/class='ok'/g) || []).length >= (base7.match(/class='ok'/g) || []).length);
const gm = V.makeChart(...G, V.makeSettings()), bm = V.makeChart(...Bo, V.makeSettings());
const count = (o) => V.matchCharts(gm, bm, V.makeSettings(o))[1];
check('rasyadhipati friends_only <= non_enemy', count({ rasyadhipati_mode: 'friends_only' }) <= count({}));
check('stree_deergha_min 26 fails it', V.match(0, 0, 14, 0, V.makeSettings({ stree_deergha_min: 26 })).stree_deergha === false);
check('vedha none removes the check failing', V.match(0, 0, 17, 7, V.makeSettings({ vedha: 'none' })).vedha === true && V.match(0, 0, 17, 7).vedha === false);
check('gana same_only vs ok', V.match(0, 0, 1, 0).gana === true && V.match(0, 0, 1, 0, V.makeSettings({ gana: 'same_only' })).gana === false);
check('paper & font in report wrapper', pm({ font_size: 'small' }).includes('--fs:11px'));
console.log(fails ? `${fails} FAILED` : 'ALL PASSED'); process.exit(fails ? 1 : 0);
