#!/bin/sh
# Publish web-src/ as the site's app (docs/app/) and rebuild its offline cache list.
# Run from the repo root after any change in web-src/, then commit docs/.
set -e
rm -rf docs/app && cp -r web-src docs/app
FILES=$(cd docs/app && find . -type f ! -name sw.js | sort | sed "s/.*/'&', /" | tr -d '\n')
V=$(cd docs/app && find . -type f ! -name sw.js -exec sha1sum {} + | sort -k2 | sha1sum | cut -c1-10)
sed "s|^const V = .*|const V = 'kaniyan-$V', FILES = [$FILES'./'];|" web-src/sw.js > docs/app/sw.js
echo "docs/app synced, cache kaniyan-$V"
