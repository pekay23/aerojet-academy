import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError } from '@/lib/api/response'
import { getAuthSession } from '@/lib/auth/auth-options'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const article = await prismaUnfiltered.newsArticle.findUnique({
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
      (session.user?.role !== 'STAFF' && session.user?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
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

    const currentArticle = await prismaUnfiltered.newsArticle.findUnique({ where: { id } })
    if (!currentArticle) return apiError('Not found', 404)

    if (slug && slug !== currentArticle.slug) {
      const existing = await prismaUnfiltered.newsArticle.findUnique({ where: { slug } })
      if (existing) return apiError('Slug already in use', 400)
    }

    let finalPublishedAt = customPublishedAt
      ? new Date(customPublishedAt)
      : publishedAt
        ? new Date(publishedAt)
        : currentArticle.publishedAt

    if (status === 'PUBLISHED' && !finalPublishedAt) {
      finalPublishedAt = new Date()
    }

    const updated = await prismaUnfiltered.newsArticle.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        status,
        customAuthorName,
        tags: tags || [],
        publishedAt: finalPublishedAt,
        customPublishedAt: customPublishedAt ? new Date(customPublishedAt) : undefined,
      },
    })

    // Revalidate public pages
    revalidatePath('/newsroom')
    revalidatePath(`/newsroom/${updated.slug}`)
    revalidatePath('/')

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
      (session.user?.role !== 'STAFF' && session.user?.role !== 'ADMIN')
    ) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    await prismaUnfiltered.newsArticle.delete({
      where: { id },
    })

    // Revalidate public pages
    revalidatePath('/newsroom')
    revalidatePath('/')

    return apiSuccess({ success: true })
  } catch (error) {
    return apiError('Internal server error', 500)
  }
}
