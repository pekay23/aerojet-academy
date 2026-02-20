import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getAuthSession } from '@/lib/auth/auth-options'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const article = await prisma.newsArticle.findUnique({
      where: { id },
    })
    if (!article) return apiError('Not found', 404)
    return apiSuccess(article)
  } catch (error) {
    return apiError('Internal server error', 500)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (
      !session ||
      ((session.user as any)?.role !== 'STAFF' && (session.user as any)?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    const data = await req.json()
    const { title, slug, excerpt, content, coverImage, status } = data

    const currentArticle = await prisma.newsArticle.findUnique({ where: { id } })
    if (!currentArticle) return apiError('Not found', 404)

    if (slug && slug !== currentArticle.slug) {
      const existing = await prisma.newsArticle.findUnique({ where: { slug } })
      if (existing) return apiError('Slug already in use', 400)
    }

    let publishedAt = currentArticle.publishedAt
    if (status === 'PUBLISHED' && currentArticle.status !== 'PUBLISHED') {
      publishedAt = new Date()
    }

    const updated = await prisma.newsArticle.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        status,
        publishedAt,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error('Error updating article:', error)
    return apiError('Internal server error', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (
      !session ||
      ((session.user as any)?.role !== 'STAFF' && (session.user as any)?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    await prisma.newsArticle.delete({
      where: { id },
    })

    return apiSuccess({ success: true })
  } catch (error) {
    return apiError('Internal server error', 500)
  }
}
