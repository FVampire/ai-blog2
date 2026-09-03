'use client';

interface DistributionSettingsProps {
  settings: Record<string, any>;
  environment: Record<string, boolean>;
  onChange: (key: string, value: any) => void;
}

const labels: Record<string, { title: string; desc: string }> = {
  distribute_enabled: { title: '启用发布流水线', desc: '发布后自动生成向量、补摘要/标签，并按下方渠道分发。' },
  distribute_on_update: { title: '更新已发布文章时再分发', desc: '默认只在第一次发布时推送到社交渠道，避免重复发文。' },
  distribute_indexnow_enabled: { title: 'IndexNow', desc: '通知 Bing 等搜索引擎收录新 URL。密钥文件位于 /indexnow-key.txt。' },
  distribute_telegram_enabled: { title: 'Telegram', desc: '使用 Bot API 发送新文章链接。' },
  distribute_telegram_chat_id: { title: 'Telegram Chat ID', desc: '也可使用环境变量 TELEGRAM_CHAT_ID。Bot Token 只能通过环境变量配置。' },
  distribute_wechat_enabled: { title: '微信公众号草稿', desc: '调用官方草稿箱 API。需要已认证公众号。' },
  distribute_wechat_app_id: { title: '公众号 AppID', desc: '可在这里保存非敏感 AppID；环境变量 WECHAT_APP_ID 优先。AppSecret 只能放在环境变量中。' },
};

const GROUPS = [
  { title: '流水线', keys: ['distribute_enabled', 'distribute_on_update', 'distribute_indexnow_enabled'] },
  { title: '即时通知', keys: ['distribute_telegram_enabled', 'distribute_telegram_chat_id'] },
  { title: '内容平台', keys: ['distribute_wechat_enabled', 'distribute_wechat_app_id'] },
];

const BOOLEAN_KEYS = new Set([
  'distribute_enabled',
  'distribute_on_update',
  'distribute_indexnow_enabled',
  'distribute_telegram_enabled',
  'distribute_wechat_enabled',
]);

const ENVIRONMENT_FIELDS = [
  { key: 'indexNow', variable: 'INDEXNOW_KEY', label: 'IndexNow' },
  { key: 'genericWebhook', variable: 'DISTRIBUTE_WEBHOOK_URL', label: '通用 Webhook' },
  { key: 'telegramToken', variable: 'TELEGRAM_BOT_TOKEN', label: 'Telegram Bot Token' },
  { key: 'telegramChatId', variable: 'TELEGRAM_CHAT_ID', label: 'Telegram Chat ID（环境覆盖）' },
  { key: 'discordWebhook', variable: 'DISCORD_WEBHOOK_URL', label: 'Discord Webhook' },
  { key: 'wechatAppId', variable: 'WECHAT_APP_ID', label: '公众号 AppID（环境覆盖）' },
  { key: 'wechatAppSecret', variable: 'WECHAT_APP_SECRET', label: '公众号 AppSecret' },
  { key: 'bilibiliWebhook', variable: 'BILIBILI_WEBHOOK_URL', label: 'B 站 Webhook' },
  { key: 'xiaohongshuWebhook', variable: 'XIAOHONGSHU_WEBHOOK_URL', label: '小红书 Webhook' },
  { key: 'douyinWebhook', variable: 'DOUYIN_WEBHOOK_URL', label: '抖音 Webhook' },
];

export default function DistributionSettings({ settings, environment, onChange }: DistributionSettingsProps) {
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
                        type="text"
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
      <div className="setting-group">
        <div className="group-header">
          <h2 className="group-title">服务器环境变量</h2>
        </div>
        <div className="group-content">
          <p className="label-desc">密钥和带凭证的 Webhook 不写入数据库。请在服务器的 .env 或部署平台中配置，重启服务后生效。</p>
          {ENVIRONMENT_FIELDS.map((field) => (
            <div className="setting-item" key={field.key}>
              <div className="setting-label">
                <span className="label-text">{field.label}</span>
                <span className="label-desc"><code>{field.variable}</code></span>
              </div>
              <div className="setting-control">
                <span className={`status-badge ${environment[field.key] ? 'published' : 'draft'}`}>
                  {environment[field.key] ? '已配置' : '未配置'}
                </span>
              </div>
            </div>
          ))}
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-text">公众号自动发布</span>
              <span className="label-desc"><code>WECHAT_AUTO_PUBLISH=true</code>；未开启时只创建草稿。</span>
            </div>
            <div className="setting-control">
              <span className={`status-badge ${environment.wechatAutoPublish ? 'published' : 'draft'}`}>
                {environment.wechatAutoPublish ? '已开启' : '仅草稿'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
