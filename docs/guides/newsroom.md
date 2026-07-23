# Newsroom — Operational Guide

## Overview

The newsroom is the public-facing blog / press release system. It lives at
`/newsroom` with paginated article listing and dynamic detail pages, plus
staff-only create/edit interfaces.

## Public Pages

### Listing (`/newsroom`)

Server component at `app/(public)/newsroom/page.tsx` with `force-dynamic` to
always fetch fresh data. Query parameters:

| Param   | Values               | Default  | Description           |
| ------- | -------------------- | -------- | --------------------- |
| `page`  | number               | 1        | Page number           |
| `limit` | number               | 9        | Articles per page     |
| `sort`  | `newest` or `oldest` | `newest` | Sort by `publishedAt` |

Renders `<NewsSortControl>`, a grid of `<NewsCard>` components, and
`<NewsPagination>`. Falls back to a placeholder cover image from UploadThing
when `article.coverImage` is null.

### Detail (`/newsroom/[slug]`)

Server component with full SEO metadata:

- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type=article`)
- Twitter Cards (`summary_large_image`)
- JSON-LD structured data (`NewsArticle` schema)
- View counting (increments on each page load)
- Read time calculation: `Math.ceil(wordCount / 200)` words per minute
- Author attribution (custom author name or linked User's profile name)
- Share buttons
- Cover image hero with gradient overlay

## Staff Management

### Create Article (`/staff/newsroom/create`)

- Title, slug, excerpt, content (markdown editor), cover image, tags
- Custom publish date and custom author name
- Status: DRAFT or PUBLISHED

### Edit Article (`/staff/newsroom/[id]/edit`)

Same fields as create, plus delete capability. Cover image preview with
re-upload support.

## Cover Images

- Upload via UploadThing's image uploader
- Stored as URL string in `NewsArticle.coverImage`
- Falls back to a hardcoded UploadThing placeholder when null
- Recommended aspect ratio: 16:9 (1200×675px minimum)

## SEO

Each article page emits:

```html
<title>{title} | Aerojet Academy Newsroom</title>
<meta name="description" content="{excerpt}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{excerpt}" />
<meta property="og:image" content="{coverImage}" />
<meta property="article:published_time" content="{publishedIso}" />
<meta name="twitter:card" content="summary_large_image" />
```

A JSON-LD `NewsArticle` block is also injected for search engines.

## Seed Script

```bash
bunx tsx prisma/seed-news-article.ts
```

Seeds 8 sample articles with cover images (stored in `public/images/newsroom/`):

1. EASA Phase 1 Completion
2. Aerojet Foundation Launch
3. Lufthansa Technical Training
4. CEO Interview — Aviation Training in Africa
5. AME Applications Open
6. Technology in Aviation Training
7. USTDA Grant Announcement
8. New Training Centre Opening

## Data Model

```prisma
model NewsArticle {
  id                String    @id @default(cuid())
  title             String
  slug              String    @unique
  excerpt           String?
  content           String
  coverImage        String?
  tags              String[]
  status            String    @default("DRAFT") // DRAFT | PUBLISHED
  publishedAt       DateTime?
  customPublishedAt DateTime?
  customAuthorName  String?
  viewCount         Int       @default(0)
  authorId          String?
  author            User?     @relation(fields: [authorId], references: [id])
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

## Key Files

| File                                                    | Purpose                                      |
| ------------------------------------------------------- | -------------------------------------------- |
| `app/(public)/newsroom/page.tsx`                        | Server-rendered listing page with pagination |
| `app/(public)/newsroom/[slug]/page.tsx`                 | Article detail with SEO                      |
| `app/(public)/newsroom/_components/NewsCard.tsx`        | Article card with image, date, tags          |
| `app/(public)/newsroom/_components/NewsSortControl.tsx` | Sort toggle (newest/oldest)                  |
| `app/(public)/newsroom/_components/NewsPagination.tsx`  | Page navigation                              |
| `app/(public)/newsroom/_components/ShareButtons.tsx`    | Social sharing                               |
| `app/staff/newsroom/create/page.tsx`                    | Staff article creation                       |
| `app/staff/newsroom/[id]/edit/page.tsx`                 | Staff article editing                        |
| `app/staff/newsroom/_components/NewsMarkdownEditor.tsx` | TipTap markdown editor                       |
| `prisma/seed-news-article.ts`                           | Sample article seeder                        |
| `public/images/newsroom/*.webp`                         | Seed article cover images                    |
