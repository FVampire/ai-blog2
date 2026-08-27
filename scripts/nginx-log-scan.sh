#!/bin/bash
LOG=/var/log/nginx/fvampire.access.log
ERR=/var/log/nginx/fvampire.error.log

echo "========== LOG FILE SIZE =========="
ls -lh "$LOG" "$ERR" 2>/dev/null

echo "========== STATUS CODES (last 20000) =========="
tail -20000 "$LOG" 2>/dev/null | awk '{print $9}' | sort | uniq -c | sort -rn | head -15

echo "========== RSC/REACT2SHELL PATTERNS =========="
grep -iE 'POST.*(_rsc|RSC|flight|next-action|x-nextjs)' "$LOG" 2>/dev/null | tail -30

echo "========== PHP / WEBSHELL PROBES =========="
grep -iE '\.php|upload-d1337|shell|eval\(|base64' "$LOG" 2>/dev/null | tail -30

echo "========== AGENT/API ABUSE =========="
grep -iE 'POST.*/api/(agent|deploy|upload|mcp)' "$LOG" 2>/dev/null | tail -30

echo "========== TOP IPs (last 10000) =========="
tail -10000 "$LOG" 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -15

echo "========== RECENT ERRORS =========="
tail -50 "$ERR" 2>/dev/null
