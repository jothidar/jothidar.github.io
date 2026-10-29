import json, subprocess, sys
from datetime import datetime
sys.path.insert(0, "/home/ubuntu/Documents/apk/vedic-core")
from vedic import *
from vedic.core import YOGAS
js = json.loads(subprocess.check_output(["node", "golden.mjs"], text=True))
cases = [(datetime(1990,1,1,6), 5.5, 13.0827, 80.2707, {}),
         (datetime(1995,3,4,10), 5.5, 13, 80, dict(ayanamsa="raman", node="true", dasa_depth=3)),
         (datetime(1985,5,5,12,30), 5.5, 9.9252, 78.1198, dict(house_system="placidus", dasa_year="savana", day_starts="midnight"))]
bad = 0
for (l, tz, lat, lon, over), j in zip(cases, js):
    st = Settings(**over); c = make_chart(l, tz, lat, lon, st)
    for k, v in c.planets.items(): assert abs(v - j["planets"][k]) < 1e-6, (k, v, j["planets"][k])
    assert abs(c.lagna - j["lagna"]) < 1e-6
    for k, v in c.planets.items():
        assert c.house(v) == j["houses"][k], ("house", k, c.house(v), j["houses"][k])
        assert navamsa(v) == j["nav"][k]
    p = panchanga(c)
    assert (p["tithi"], p["karana"], p["yoga"], p["nakshatra"], p["vara"]) == tuple(j["pan"][x] for x in ("tithi","karana","yoga","nakshatra","vara")), (p, j["pan"])
    for a, b in ((p["sunrise"], j["pan"]["sunrise"]), (p["sunset"], j["pan"]["sunset"])):
        assert abs((int(a.strftime("%H"))*60+a.minute) - (int(b[:2])*60+int(b[3:]))) <= 1, (a, b)
    d = dasas(c)
    for m, jm in zip(d, j["dasa"]):
        assert m["lord"] == jm[0] and m["start"].strftime("%Y-%m-%d") == jm[1] and m["end"].strftime("%Y-%m-%d") == jm[2], (m["lord"], jm)
        assert len(m["sub"]) == jm[3] and (len(m["sub"][0]["sub"]) if m["sub"] else 0) == jm[4]
st = Settings()
for a, jr in zip([(0,0,0,0),(0,0,17,7),(13,0,25,0),(5,3,22,9),(10,11,3,4)], js[-1]):
    assert match(a[0], a[1], a[2], a[3], st) == jr, (a, match(*a, st), jr)
print("JS == Python on", len(cases), "charts and 5 porutham pairs")
