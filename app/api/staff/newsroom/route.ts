import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getAuthSession } from '@/lib/auth/auth-options'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (
      !session ||
      ((session.user as any)?.role !== 'STAFF' && (session.user as any)?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const articles = await prisma.newsArticle.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { email: true, profile: { select: { firstName: true, lastName: true } } },
        },
      },
    })

    return apiSuccess(articles)
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
      ((session.user as any)?.role !== 'STAFF' && (session.user as any)?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const data = await req.json()
    const { title, slug, excerpt, content, coverImage, status } = data

    if (!title || !slug || !content) {
      return apiError('Title, slug, and content are required', 400)
    }

    const existing = await prisma.newsArticle.findUnique({ where: { slug } })
    if (existing) {
      return apiError('An article with this slug already exists', 400)
    }

    const article = await prisma.newsArticle.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        status: status || 'DRAFT',
        authorId: (session.user as any)?.id,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
      },
    })

    return apiSuccess(article, 201)
  } catch (error) {
    console.error('Error creating article:', error)
    return apiError('Internal server error', 500)
  }
}
