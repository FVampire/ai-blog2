-- Feishu comment notification settings

INSERT INTO settings (key, value, type, description) VALUES
  ('feishu_notify_enabled', 'false', 'boolean', '有人发表评论时发送飞书通知'),
  ('feishu_webhook_url', '', 'string', '飞书自定义机器人 Webhook 地址，也可通过环境变量 FEISHU_WEBHOOK_URL 配置（环境变量优先）'),
  ('feishu_webhook_secret', '', 'string', '自定义机器人签名密钥（可选），也可通过 FEISHU_WEBHOOK_SECRET 配置')
ON CONFLICT (key) DO NOTHING;
