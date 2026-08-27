#!/bin/bash
echo "========== USERS (uid>=1000) =========="
awk -F: '$3>=1000 && $3<65534 {print}' /etc/passwd
echo "========== AUTHORIZED_KEYS count =========="
wc -l /home/ubuntu/.ssh/authorized_keys 2>/dev/null
echo "========== SUDOERS.D =========="
ls -la /etc/sudoers.d/
echo "========== CRONTABS =========="
crontab -l 2>/dev/null
sudo crontab -l 2>/dev/null
echo "========== SUSPICIOUS FILES =========="
find /home/ubuntu/pencil-blog -type f \( -name '*.php' -o -name '*xmrig*' -o -name '*.tar.gz' \) 2>/dev/null
find /tmp /var/tmp -maxdepth 2 -type f \( -name '*.sh' -o -name '*.php' \) 2>/dev/null | head -20
echo "========== PM2 =========="
/home/ubuntu/.local/share/pnpm/global/5/node_modules/pm2/bin/pm2 list 2>/dev/null
echo "========== LISTENING =========="
sudo ss -tlnp 2>/dev/null | head -25
echo "========== TOP CPU =========="
ps aux --sort=-%cpu | head -12
