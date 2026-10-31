#!/bin/bash
# Read-only machine check before launching a run. Never stops anything.
# Usage: tools/resource-guard.sh            -> one line, exit 1 = hold new launches
#        tools/resource-guard.sh --watch    -> prints only changes/events, every 60 s (use as a monitor)
# Hold when load1 > 9 (11 cores) or free memory < 20%. Reports any rise in Chrome for Testing processes.
MAX_LOAD=${MAX_LOAD:-9}; MIN_FREE=${MIN_FREE:-20}
check() {
  load=$(sysctl -n vm.loadavg | awk '{print $2}')
  free=$(memory_pressure | awk -F': ' '/free percentage/{gsub("%","",$2); print $2}')
  cft=$(pgrep -f "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" | wc -l | tr -d " ")
  hold=0; awk -v l="$load" -v m="$MAX_LOAD" 'BEGIN{exit !(l>m)}' && hold=1; [ "${free:-100}" -lt "$MIN_FREE" ] && hold=1
}
if [ "$1" != "--watch" ]; then
  check; echo "load1=$load free=${free}% chrome_for_testing=$cft $([ $hold = 1 ] && echo HOLD || echo OK)"; exit $hold
fi
check; base=$cft; last=$hold; echo "guard start load1=$load free=${free}% chrome_for_testing=$base"
while true; do
  sleep 60; check
  [ "$cft" -gt "$base" ] && echo "CHROME-FOR-TESTING-UP $base -> $cft (find the run that launched it)" && base=$cft
  [ "$hold" != "$last" ] && echo "$([ $hold = 1 ] && echo HOLD || echo OK-AGAIN) load1=$load free=${free}%" && last=$hold
done
