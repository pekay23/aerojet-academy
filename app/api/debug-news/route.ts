import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        customPublishedAt: true,
      },
    })

    return NextResponse.json({
      count: articles.length,
      articles,
      now: new Date().toISOString(),
      serverEnv: process.env.NODE_ENV,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
