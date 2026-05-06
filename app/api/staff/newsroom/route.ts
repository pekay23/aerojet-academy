import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, apiPaginated, parsePagination } from '@/lib/api/response'
import { getAuthSession } from '@/lib/auth/auth-options'
import { NewsArticleStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (
      !session ||
      (session.user?.role !== 'STAFF' && session.user?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const { page, limit, skip } = parsePagination(searchParams)
    const where = status ? { status: status as NewsArticleStatus } : undefined

    const [articles, total] = await Promise.all([
      prismaUnfiltered.newsArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { email: true, profile: { select: { firstName: true, lastName: true } } },
          },
        },
        take: limit,
        skip,
      }),
      prismaUnfiltered.newsArticle.count({ where }),
    ])

    return apiPaginated(articles, total, page, limit)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return apiError('Internal server error', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (
      !session ||
      (session.user?.role !== 'STAFF' && session.user?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const data = await req.json()
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      status,
      customAuthorName,
      publishedAt,
      customPublishedAt,
      tags,
    } = data

    if (!title || !slug || !content) {
      return apiError('Title, slug, and content are required', 400)
    }

    const existing = await prismaUnfiltered.newsArticle.findUnique({ where: { slug } })
    if (existing) {
      return apiError('An article with this slug already exists', 400)
    }

    const article = await prismaUnfiltered.newsArticle.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        status: status || 'DRAFT',
        customAuthorName,
        tags: tags || [],
        authorId: session.user?.id,
        publishedAt: customPublishedAt
          ? new Date(customPublishedAt)
          : publishedAt
            ? new Date(publishedAt)
            : status === 'PUBLISHED'
              ? new Date()
              : undefined,
        customPublishedAt: customPublishedAt ? new Date(customPublishedAt) : undefined,
      },
    })

    // Revalidate public pages
    revalidatePath('/newsroom')
    revalidatePath('/')

    return apiSuccess(article, 201)
  } catch (error) {
    console.error('Error creating article:', error)
    return apiError('Internal server error', 500)
  }
}
