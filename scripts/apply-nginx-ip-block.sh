#!/bin/bash
set -e
sudo mkdir -p /etc/nginx/snippets
cat << 'EOF' | sudo tee /etc/nginx/snippets/block-scanners.conf
# Block malicious IPs (React2Shell scanner / exploitation)
deny 160.119.71.90;
EOF

for f in /etc/nginx/sites-enabled/10-blog /etc/nginx/sites-enabled/zz-blog; do
  if [ -f "$f" ] && ! grep -q block-scanners.conf "$f"; then
    sudo sed -i '/server_name/a\    include /etc/nginx/snippets/block-scanners.conf;' "$f"
  fi
done

grep -n block-scanners /etc/nginx/sites-enabled/10-blog || true
sudo docker exec mail nginx -t
sudo docker exec mail nginx -s reload
echo "IP block applied OK"
