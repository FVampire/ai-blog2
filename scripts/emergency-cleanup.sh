#!/bin/bash
# Emergency cleanup - run on server as ubuntu (needs sudo)
set -e
export PATH=/usr/bin:/bin:/sbin

echo "=== 1. Kill malware processes ==="
for pat in 'lrt' 'let' 'q2MmCMg' 'xmrig' '/dev/shm/' '/tmp/lrt' '/tmp/let'; do
  pkill -9 -f "$pat" 2>/dev/null || true
done
sleep 1

echo "=== 2. Remove malware binaries and dropper dir ==="
rm -f /dev/shm/lrt /dev/shm/let /tmp/lrt /tmp/let /dev/shm/q2MmCMg
sudo rm -rf /tmp/runnv
ls -la /dev/shm/ 2>/dev/null || true

echo "=== 3. Disable malicious systemd services ==="
if [ -f /etc/systemd/system/alive.service ]; then
  sudo systemctl stop alive.service 2>/dev/null || true
  sudo systemctl disable alive.service 2>/dev/null || true
  sudo rm -f /etc/systemd/system/alive.service
  sudo rm -f /etc/systemd/system/multi-user.target.wants/alive.service
fi
if [ -f /etc/systemd/system/lived.service ]; then
  sudo systemctl stop lived.service 2>/dev/null || true
  sudo systemctl disable lived.service 2>/dev/null || true
  sudo rm -f /etc/systemd/system/lived.service
  sudo rm -f /etc/systemd/system/multi-user.target.wants/lived.service
fi
sudo systemctl daemon-reload

echo "=== 4. PM2 save (empty list) ==="
export PATH=/home/ubuntu/.nvm/versions/node/v21.5.0/bin:$PATH
PM2=/home/ubuntu/.local/share/pnpm/global/5/node_modules/pm2/bin/pm2
if [ -x "$PM2" ]; then
  "$PM2" save --force 2>/dev/null || true
fi

echo "=== 5. Verify ==="
echo "--- processes ---"
ps aux | grep -E 'lrt|let|xmrig|/dev/shm' | grep -v grep || echo "(none)"
echo "--- /dev/shm ---"
ls -la /dev/shm/
echo "--- alive/lived ---"
systemctl is-enabled alive.service lived.service 2>/dev/null || echo "services removed"
echo "=== DONE ==="
