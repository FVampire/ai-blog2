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
| `imageUrl` | No | Cover image path e.g. `/uploads/xxx.jpg` |
| `projectSlug` | No | Link post to a project showcase |

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
