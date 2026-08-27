#!/bin/bash
# Deep security scan - run as ubuntu with sudo where needed
export PATH=/usr/bin:/bin:/sbin:/usr/local/bin:/home/ubuntu/.nvm/versions/node/v21.5.0/bin

REPORT="/tmp/security-scan-$(date +%Y%m%d-%H%M%S).txt"
exec > >(tee "$REPORT") 2>&1

echo "========== SCAN START $(date) =========="

echo ""
echo "========== 1. MALWARE PROCESSES =========="
ps aux | grep -E 'q2MmCMg|xmrig|kdevtmpfsi|kinsing|\.shm/|/dev/shm/' | grep -v grep || echo "(none matched)"
ps aux --sort=-%cpu | head -n 15

echo ""
echo "========== 2. /dev/shm & /tmp EXECUTABLES =========="
find /dev/shm /tmp /var/tmp -type f 2>/dev/null | while read -r f; do
  if file "$f" 2>/dev/null | grep -q ELF; then
    echo "ELF: $f"
    ls -la "$f"
  fi
done
ls -laR /dev/shm/ 2>/dev/null

echo ""
echo "========== 3. USERS & SSH =========="
awk -F: '$3>=1000 && $3<65534 {print}' /etc/passwd
echo "--- authorized_keys ubuntu ---"
cat /home/ubuntu/.ssh/authorized_keys 2>/dev/null
echo "--- authorized_keys root ---"
sudo cat /root/.ssh/authorized_keys 2>/dev/null || echo "(no access or empty)"

echo ""
echo "========== 4. CRONTABS =========="
echo "--- ubuntu ---"
crontab -l 2>/dev/null || echo "(empty)"
echo "--- root ---"
sudo crontab -l 2>/dev/null || echo "(empty)"
echo "--- /etc/cron.d ---"
ls -la /etc/cron.d/ 2>/dev/null
sudo grep -r . /etc/cron.d/ 2>/dev/null | grep -v '^#' | grep -v '^$' || true
echo "--- /etc/crontab ---"
sudo cat /etc/crontab 2>/dev/null

echo ""
echo "========== 5. SUDOERS =========="
sudo ls -la /etc/sudoers.d/
for f in /etc/sudoers.d/*; do
  echo "--- $f ---"
  sudo cat "$f" 2>/dev/null
done

echo ""
echo "========== 6. SYSTEMD CUSTOM =========="
systemctl list-unit-files --type=service --state=enabled 2>/dev/null | grep -vE '^(UNIT|cloud-|snap|ssh|cron|rsyslog|systemd|dbus|network|ufw|apparmor|getty|serial|grub|irqbalance|polkit|unattended|snapd|ModemManager|multipathd|lxd|containerd|docker)' | head -n 30
ls -la /etc/systemd/system/*.service 2>/dev/null
ls -la /etc/systemd/system/multi-user.target.wants/ 2>/dev/null | head -n 20

echo ""
echo "========== 7. SHELL RC PERSISTENCE =========="
for f in /home/ubuntu/.bashrc /home/ubuntu/.profile /home/ubuntu/.bash_profile /home/ubuntu/.zshrc /etc/profile /etc/bash.bashrc; do
  if [ -f "$f" ]; then
    echo "--- $f (suspicious lines) ---"
    grep -nE 'curl|wget|base64|/dev/shm|nohup|\.sh|eval|chmod|/tmp/' "$f" 2>/dev/null || echo "(clean or no match)"
  fi
done

echo ""
echo "========== 8. LISTENING PORTS =========="
sudo ss -tlnp 2>/dev/null | head -n 30

echo ""
echo "========== 9. PM2 =========="
/home/ubuntu/.local/share/pnpm/global/5/node_modules/pm2/bin/pm2 list 2>/dev/null || echo "pm2 empty or error"

echo ""
echo "========== 10. PENCIL-BLOG SUSPICIOUS =========="
find /home/ubuntu/pencil-blog -maxdepth 3 \( -name '*.php' -o -name '*.sh' -o -name '*xmrig*' -o -name '*.tar.gz' \) -type f 2>/dev/null | grep -v node_modules | head -n 40
find /home/ubuntu -maxdepth 2 \( -name '*.php' -o -name 'xmrig*' \) 2>/dev/null

echo ""
echo "========== 11. LD_PRELOAD / CURL =========="
echo "LD_PRELOAD=$LD_PRELOAD"
ls -la /etc/ld.so.preload 2>/dev/null || echo "no ld.so.preload"
cat /etc/ld.so.preload 2>/dev/null
which curl wget 2>/dev/null
/usr/bin/curl -sI --connect-timeout 5 https://www.google.com 2>&1 | head -n 3 || echo "curl failed"

echo ""
echo "========== 12. DOCKER =========="
sudo docker ps -a 2>/dev/null
sudo docker images 2>/dev/null | head -n 10

echo ""
echo "========== 13. RECENTLY MODIFIED /etc (7d) =========="
sudo find /etc -mtime -7 -type f 2>/dev/null | head -n 30

echo ""
echo "========== 14. NGINX LOG STATS =========="
LOG=/var/log/nginx/fvampire.access.log
if [ -f "$LOG" ]; then
  echo "Log size: $(wc -l < "$LOG") lines"
  echo "--- Status codes ---"
  awk '{print $9}' "$LOG" | sort | uniq -c | sort -rn | head -n 10
  echo "--- POST requests (last 30) ---"
  grep ' POST ' "$LOG" | tail -n 30
  echo "--- next-action / React2Shell ---"
  grep -iE 'next-action|Next-Action|RSC_ACTION' "$LOG" | tail -n 20
  echo "--- /api/agent abuse ---"
  grep '/api/agent' "$LOG" | tail -n 15
  echo "--- Top IPs ---"
  awk '{print $1}' "$LOG" | sort | uniq -c | sort -rn | head -n 15
else
  echo "Access log not at $LOG, trying docker..."
  sudo docker exec mail wc -l /var/log/nginx/fvampire.access.log 2>/dev/null
  sudo docker exec mail grep -i 'next-action' /var/log/nginx/fvampire.access.log 2>/dev/null | tail -n 20
  sudo docker exec mail grep ' POST ' /var/log/nginx/fvampire.access.log 2>/dev/null | tail -n 30
fi

echo ""
echo "========== SCAN END =========="
echo "Report saved: $REPORT"
