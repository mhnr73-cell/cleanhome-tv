#!/bin/bash
# Installs the latest Clean Home onto the TV. Run it in Terminal with:
#   bash <(curl -sL https://mhnr73-cell.github.io/cleanhome-tv/update-tv.sh)
# Change TV_IP if your TV's address changes.
TV_IP="${TV_IP:-192.168.0.200}"
SITE="https://mhnr73-cell.github.io/cleanhome-tv/app/"
FILES="config.xml index.html loader.js apps.js main.js style.css hdmi.svg icon.png .project .tproject"

TIZEN_HOME="$HOME/tizen-studio"
SDB="$TIZEN_HOME/tools/sdb"
TIZEN="$TIZEN_HOME/tools/ide/bin/tizen"
TARGET="$TV_IP:26101"

step() { echo; echo "==> $1"; }
fail() { echo; echo "!! $1"; echo; exit 1; }

[ -x "$SDB" ] && [ -x "$TIZEN" ] || fail "Can't find Tizen Studio in $TIZEN_HOME."

step "Connecting to the TV at $TV_IP"
"$SDB" kill-server >/dev/null 2>&1
"$SDB" connect "$TARGET" || fail "Couldn't reach the TV. Is it on, and is Developer Mode still on?"
"$SDB" devices | grep -q "$TARGET" || fail "The TV didn't accept the connection."

step "Finding your certificate"
PROFILE="$("$TIZEN" security-profiles list 2>/dev/null | awk '$NF=="O"{print $1; exit}')"
[ -n "$PROFILE" ] || PROFILE="$("$TIZEN" security-profiles list 2>/dev/null | awk 'f&&NF{print $1; exit} /Profile Name/{f=1}')"
[ -n "$PROFILE" ] || fail "No certificate found. Make one in Tizen Studio: Tools, Certificate Manager."
echo "Using certificate: $PROFILE"

step "Downloading the latest Clean Home"
WORK="$(mktemp -d)"
mkdir -p "$WORK/CleanHome"
for f in $FILES; do
  curl -sfL "$SITE$f?v=$(date +%s)" -o "$WORK/CleanHome/$f" || fail "Couldn't download $f. Check the Mac's internet."
done

step "Building Clean Home"
"$TIZEN" build-web -- "$WORK/CleanHome" >/dev/null || fail "Build failed."
"$TIZEN" package -t wgt -s "$PROFILE" -- "$WORK/CleanHome/.buildResult" || fail "Packaging failed. Check your certificate password in Certificate Manager."

step "Installing on the TV"
# Older TVs can't handle spaces in the file name, so rename it first.
WGT="$(ls "$WORK/CleanHome/.buildResult/"*.wgt | head -1)"
mv "$WGT" "$WORK/CleanHome/.buildResult/CleanHome.wgt"
install_it() { "$TIZEN" install -n CleanHome.wgt -s "$TARGET" -- "$WORK/CleanHome/.buildResult"; }
if ! install_it; then
  # The TV sometimes refuses to replace an existing copy, so remove it and retry.
  echo; echo "Removing the old copy from the TV, then trying again..."
  "$TIZEN" uninstall -p CLNhome001.CleanHome -s "$TARGET"
  install_it || fail "Install failed. Send Claude a screenshot of this window."
fi
"$TIZEN" run -p CLNhome001.CleanHome -s "$TARGET" >/dev/null 2>&1

rm -rf "$WORK"
echo; echo "Done! Clean Home is updated on your TV."
