'use client';

interface DistributionSettingsProps {
  settings: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

const labels: Record<string, { title: string; desc: string }> = {
  distribute_enabled: { title: '启用发布流水线', desc: '发布后自动生成向量、补摘要/标签，并按下方渠道分发。' },
  distribute_on_update: { title: '更新已发布文章时再分发', desc: '默认只在第一次发布时推送到社交渠道，避免重复发文。' },
  distribute_indexnow_enabled: { title: 'IndexNow', desc: '通知 Bing 等搜索引擎收录新 URL。密钥文件位于 /indexnow-key.txt。' },
  distribute_indexnow_key: { title: 'IndexNow 密钥', desc: '也可使用环境变量 INDEXNOW_KEY。' },
  distribute_webhook_url: { title: '通用 Webhook', desc: '发布后 POST JSON。可接到 n8n、Make、自建脚本。' },
  distribute_telegram_enabled: { title: 'Telegram', desc: '使用 Bot API 发送新文章链接。' },
  distribute_telegram_bot_token: { title: 'Telegram Bot Token', desc: '也可使用 TELEGRAM_BOT_TOKEN。' },
  distribute_telegram_chat_id: { title: 'Telegram Chat ID', desc: '也可使用 TELEGRAM_CHAT_ID。' },
  distribute_discord_webhook_url: { title: 'Discord Webhook', desc: '也可使用 DISCORD_WEBHOOK_URL。' },
  distribute_wechat_enabled: { title: '微信公众号草稿', desc: '调用官方草稿箱 API。需要已认证公众号。' },
  distribute_wechat_app_id: { title: '公众号 AppID', desc: '也可使用 WECHAT_APP_ID。' },
  distribute_wechat_app_secret: { title: '公众号 AppSecret', desc: '也可使用 WECHAT_APP_SECRET。' },
  distribute_bilibili_webhook: { title: 'B 站 Webhook', desc: 'B 站没有开放个人专栏发文 API。把适配文案 POST 到这里，或到分发记录里复制。' },
  distribute_xiaohongshu_webhook: { title: '小红书 Webhook', desc: '小红书没有开放个人发文 API。接到自动化工作流即可自动发。' },
  distribute_douyin_webhook: { title: '抖音 Webhook', desc: '抖音个人图文没有通用开放 API。接到自动化工作流即可自动发。' },
};

const GROUPS = [
  { title: '流水线', keys: ['distribute_enabled', 'distribute_on_update', 'distribute_indexnow_enabled', 'distribute_indexnow_key'] },
  { title: '即时通知', keys: ['distribute_webhook_url', 'distribute_telegram_enabled', 'distribute_telegram_bot_token', 'distribute_telegram_chat_id', 'distribute_discord_webhook_url'] },
  { title: '内容平台', keys: ['distribute_wechat_enabled', 'distribute_wechat_app_id', 'distribute_wechat_app_secret', 'distribute_bilibili_webhook', 'distribute_xiaohongshu_webhook', 'distribute_douyin_webhook'] },
];

const BOOLEAN_KEYS = new Set([
  'distribute_enabled',
  'distribute_on_update',
  'distribute_indexnow_enabled',
  'distribute_telegram_enabled',
  'distribute_wechat_enabled',
]);

const SECRET_KEYS = new Set([
  'distribute_indexnow_key',
  'distribute_telegram_bot_token',
  'distribute_wechat_app_secret',
]);

export default function DistributionSettings({ settings, onChange }: DistributionSettingsProps) {
  return (
    <div className="ai-settings">
      {GROUPS.map((group) => (
        <div className="setting-group" key={group.title}>
          <div className="group-header">
            <h2 className="group-title">{group.title}</h2>
          </div>
          <div className="group-content">
            {group.keys.map((key) => {
              const meta = labels[key];
              const value = settings[key];
              return (
                <div className="setting-item" key={key}>
                  <div className="setting-label">
                    <span className="label-text">{meta.title}</span>
                    <span className="label-desc">{meta.desc}</span>
                  </div>
                  <div className="setting-control">
                    {BOOLEAN_KEYS.has(key) ? (
                      <label className="toggle-switch">
                        <input type="checkbox" checked={value === true} onChange={(event) => onChange(key, event.target.checked)} />
                        <span className="toggle-slider" />
                      </label>
                    ) : (
                      <input
                        type={SECRET_KEYS.has(key) ? 'password' : 'text'}
                        value={value || ''}
                        onChange={(event) => onChange(key, event.target.value)}
                        className="settings-input"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
