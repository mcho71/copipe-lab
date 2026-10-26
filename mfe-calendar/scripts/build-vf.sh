#!/bin/sh
# Builds the guest for Visualforce and zips it into the mfeCalendarVf static resource.
set -e
cd "$(dirname "$0")/../guest"
npm run build:vf
rm -f ../force-app/main/default/staticresources/mfeCalendarVf.zip
(cd dist-vf && zip -qr ../../force-app/main/default/staticresources/mfeCalendarVf.zip assets)
