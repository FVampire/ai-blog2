# Agent 工作约定

## 生成内容工作区

Agent 生成的文章、图片、一次性发布脚本和运行状态统一放在仓库根目录的 `.agent-generated/`。该目录已被 Git 忽略，不得使用 `git add -f` 强制提交。

每个文章系列使用独立子目录，建议结构如下：

```text
.agent-generated/<series>/
├── articles/              # Markdown 文章，文件名前缀表示顺序
├── cover.webp             # 系列共用封面
├── publish.mjs            # 可续跑的发布脚本
├── export.mjs             # 从数据库导出已发布内容
└── publish-state.json     # 文章 ID、URL 和执行状态
```

## 项目案例素材

`/projects/*` 案例页的视频、截图和渲染图存放在 COS，页面通过 `app/projects/media.ts` 的 `projectMedia()` 引用，目录清单在 `scripts/project-media-dirs.mjs`（与 `.gitignore` 保持一致），不进入 Git。

- 更新素材时新建带版本号的目录（如 `shots-r7`、`video-r4`），不要覆盖同名文件：COS 对象设置了一年 `immutable` 缓存。
- 本地放好文件后运行 `node scripts/upload-project-media-to-cos.mjs`（先加 `--dry-run` 预览；已存在且大小相同的对象会跳过）。
- 可交互嵌入页（`app/`、`viewer/`、`assets/`）仍放在 `public/`：它们是需要同源的 HTML，COS 默认域名会强制下载 HTML。
- 本地离线开发可设 `PROJECT_MEDIA_LOCAL=1`，改为读取 `public/`。

## 安全边界

- 密钥只从 `.env` 或进程环境变量读取，不得写入文章、脚本、状态文件或日志。
- `.env`、`.agent-generated/` 和 `public/uploads/` 均不得提交。
- 发布文章只使用 `SITE_URL` 和 `AGENT_API_KEY`；直接修改数据库前必须确认操作范围，并且只更新本次发布的文章。

## 发布流程

1. 将文章和封面保存在 `.agent-generated/<series>/`。
2. 封面优先使用 WebP，并确保体积低于反向代理和上传接口限制。
3. 先上传一次封面，再将返回的同一图片 URL 用于系列内所有文章。
4. 逐篇发布并即时保存 `publish-state.json`，重试时不得重复创建已经成功的文章。
5. 获得全部文章 ID 后，通过 Agent API 写入双向 `prevPostId`/`nextPostId`。
6. 发布结束后逐篇验证公开 URL、标题、封面响应和上一篇/下一篇导航。

数据库中的已发布文章是线上展示数据源；`.agent-generated/` 只是本地可恢复、可续跑的工作区。只有可复用的平台能力和缺陷修复才进入正式 Git 提交。
