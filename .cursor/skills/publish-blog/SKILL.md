---
name: publish-blog
description: >-
  Publish blog posts to the local ai-blog2 instance via Agent API. Use when the
  user asks to publish a blog, post an article, write a blog about a project,
  showcase project results, or one-click publish from Cursor Agent.
---

# Publish Blog to ai-blog2

Publish Markdown articles to your local blog server using the Agent API.

## Prerequisites

1. Blog server running (`pnpm dev` or `docker compose up`)
2. `.env` configured with `AGENT_API_KEY`
3. Database migrated (`pnpm migrate`)

## Configuration

Read from project `.env` or environment:

| Variable | Purpose |
|----------|---------|
| `SITE_URL` | Blog base URL (default `http://localhost:3000`) |
| `AGENT_API_KEY` | API key for Agent endpoints |
| `COS_SECRET_ID` / `COS_SECRET_KEY` / `COS_BUCKET` / `COS_REGION` | Tencent COS; required for uploads |

## Publish a Blog Post

```bash
curl -X POST "${SITE_URL}/api/agent/publish" \
  -H "Authorization: Bearer ${AGENT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "文章标题",
    "content": "# Markdown 正文\n\n内容...",
    "excerpt": "简短摘要",
    "tags": ["typescript", "nextjs"],
    "status": "published",
    "projectSlug": "my-project"
  }'
```

### Request Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `content` | No | Markdown body |
| `excerpt` | No | Summary (auto from title if omitted) |
| `tags` | No | Tag names (auto-created if missing) |
| `status` | No | `published` (default) or `draft` |
| `slug` | No | URL slug (auto-generated from title) |
| `imageUrl` | No | Cover image URL from `/api/agent/upload`, or `/uploads/xxx.jpg` |
| `projectSlug` | No | Link post to a project showcase |
| `seriesSlug` | No | Append to a public series (`/series/<slug>`) |

Published posts automatically generate embeddings, fill empty excerpt/tags, ping IndexNow, and fan out to configured channels.

## MCP Server

This blog is also an MCP server. Cursor / Claude Desktop can call tools directly instead of using curl.

```json
{
  "mcpServers": {
    "ai-blog": {
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer ${AGENT_API_KEY}"
      }
    }
  }
}
```

Tools: `search_posts`, `get_post`, `list_posts`, `list_projects`, `get_project`, `list_series`, `get_series`, `publish_post`, `list_distribution_jobs`.

Prefer `publish_post` with `"status": "draft"` unless the user explicitly asks to publish.

## Series

After publishing a sequence of posts, link them:

```bash
curl -X PUT "${SITE_URL}/api/agent/publish" \
  -H "Authorization: Bearer ${AGENT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id": 2, "prevPostId": 1}'
```

Or pass `seriesSlug` on publish. Public catalog: `/series`.

## Outbound distribution

Configure in Admin → 站点设置 → 发布分发, or env:

| Variable | Purpose |
|----------|---------|
| `INDEXNOW_KEY` | IndexNow key served at `/indexnow-key.txt` |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram |
| `DISCORD_WEBHOOK_URL` | Discord |
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET` | WeChat MP draft box |
| `WECHAT_AUTO_PUBLISH` | Set `true` to submit the WeChat draft for publishing when the account has permission |
| `DISTRIBUTE_WEBHOOK_URL` | Generic JSON webhook |
| `BILIBILI_WEBHOOK_URL` | Bilibili automation webhook |
| `XIAOHONGSHU_WEBHOOK_URL` | Xiaohongshu automation webhook |
| `DOUYIN_WEBHOOK_URL` | Douyin automation webhook |

Bilibili / 小红书 / 抖音 have no general-purpose official personal posting API. The pipeline writes platform-adapted copy and POSTs it to the webhook you configure (n8n etc.). If no webhook is set, the publishing package is stored in Admin → 分发记录, where an admin can copy or download it, open the creator center, and mark it as published.

Secrets and credential-bearing webhook URLs are read only from `.env` or the process environment. The Admin settings page reports whether each variable is configured without returning its value.

### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "article-slug",
    "url": "/posts/article-slug",
    "fullUrl": "http://localhost:3000/posts/article-slug"
  }
}
```

## Register a Project (Showcase)

Before publishing project-related posts, register the project:

```bash
curl -X POST "${SITE_URL}/api/agent/projects" \
  -H "Authorization: Bearer ${AGENT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "我的项目",
    "description": "项目简介",
    "techStack": ["Next.js", "TypeScript", "PostgreSQL"],
    "repoUrl": "https://gitee.com/user/repo",
    "demoUrl": "https://demo.example.com",
    "featured": true
  }'
```

Then publish with `"projectSlug": "我的项目"` (slug auto-generated from name).

## Upload Image

```bash
curl -X POST "${SITE_URL}/api/agent/upload" \
  -H "Authorization: Bearer ${AGENT_API_KEY}" \
  -F "file=@/path/to/image.png"
```

Use returned `data.url` as `imageUrl` when publishing.

## Workflow: Publish Project Showcase

When user asks to blog about another project:

1. **Register project** → `POST /api/agent/projects`
2. **Write article** → compose Markdown about the project's features, tech stack, results
3. **Publish** → `POST /api/agent/publish` with `projectSlug`
4. **Confirm** → share `fullUrl` with user

## Health Check

```bash
curl "${SITE_URL}/api/agent/publish" \
  -H "Authorization: Bearer ${AGENT_API_KEY}"
```

## Deploy Webhook

Trigger auto-deployment after git push:

```bash
curl -X POST "${SITE_URL}/api/deploy/webhook" \
  -H "Authorization: Bearer ${DEPLOY_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"branch": "main"}'
```
