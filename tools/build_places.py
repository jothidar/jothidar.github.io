"""Builds www/data/places.json from GeoNames dumps (CC-BY 4.0, geonames.org).
Row: [name, tamil_name, state, country, lat, lon, iana_tz]. Sorted by population."""
import csv, json, sys
G = "geo/"
OUT = "../web-src/data/places.json"
KEEP500 = {"IN", "LK", "SG", "MY"}          # small towns (pop >= 500) only where the app's users are
country = {}
for l in open(G + "countryInfo.txt", encoding="utf8"):
    if not l.startswith("#") and l.strip():
        f = l.split("\t"); country[f[0]] = f[4]
admin = {}
for l in open(G + "admin1CodesASCII.txt", encoding="utf8"):
    f = l.rstrip("\n").split("\t"); admin[f[0]] = f[2]
ta = {}                                       # geonameid -> Tamil name (preferred wins)
for f in csv.reader(open(G + "alt_ta.txt", encoding="utf8"), delimiter="\t", quoting=csv.QUOTE_NONE):
    tamil = len(f) > 4 and any("\u0b80" <= ch <= "\u0bff" for ch in f[3])           # Latin "ta" entries exist; skip them
    if tamil and (f[1] not in ta or f[4] == "1") and f[7:8] != ["1"]:                 # skip historic names
        ta[f[1]] = f[3]
rows = {}
for fn, only in (("cities15000.txt", None), ("cities500.txt", KEEP500)):
    for l in open(G + fn, encoding="utf8"):
        f = l.rstrip("\n").split("\t")
        if only and f[8] not in only: continue
        rows[f[0]] = (int(f[14] or 0), [f[1], ta.get(f[0], ""), admin.get(f"{f[8]}.{f[10]}", ""),
                                         country.get(f[8], f[8]), round(float(f[4]), 4), round(float(f[5]), 4), f[17]])
out = [r for _, r in sorted(rows.values(), key=lambda x: -x[0])]
json.dump(out, open(OUT, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "places;", sum(1 for r in out if r[1]), "with Tamil names")
