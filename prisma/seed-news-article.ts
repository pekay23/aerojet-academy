import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const dbConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!dbConnectionString) {
  console.error('❌ DATABASE_URL or DIRECT_URL must be set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: dbConnectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('📰 Seeding news article...')

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  })

  if (!admin) {
    console.error('❌ No admin user found. Run the main seed first.')
    process.exit(1)
  }

  const D = (s: string) =>
    s
      .split('\n')
      .map((l) => l.trimStart())
      .join('\n')
      .trim()

  const article = {
    title: 'Aerojet Trainee Engineers Complete Phase 1 of EASA Part 66 Certification',
    slug: 'easa-part-66-phase-one-completion',
    excerpt:
      "The first batch of Aerojet Aviation trainee engineers has successfully completed Phase 1 of EASA Part 66 certification, validating the Academy's training methodology and creating Africa's next generation of certified aviation professionals.",
    content: D(String.raw`
<h2 class="article-section-heading">Transformative Milestone for Ghana's Aviation Workforce</h2>

<div class="article-stat">
  <p><strong>40+</strong> trainee engineers completed Phase 1 certification</p>
  <p><strong>August 2025</strong> — First EASA Part 66 examinations successfully passed</p>
</div>

<p>In <strong>August 2025</strong>, the first batch of over 40 Aerojet Trainee Engineers successfully completed <strong>Phase 1 of EASA Part 66 certification</strong>, marking a transformative moment for Ghana's aviation technical workforce. These engineers have mastered European aviation safety agency standards through intensive theoretical coursework combined with practical workshop experience at the ATTC Kokomlemle training facility.</p>

<div class="article-pullquote">"Aerojet Aviation Training Academy conducted its first set of EASA examinations for our first batch of students, and we are absolutely thrilled to share they performed brilliantly."</div>
<p class="text-sm text-slate-500 mt-2 text-center">— Aerojet Aviation Leadership</p>

<hr class="my-10 border-slate-200">

<h2 class="article-section-heading">Certification Achievement Details</h2>

<p>Phase 1 completion signifies that trainees have successfully passed the rigorous EASA Part-66 module examinations covering:</p>

<ul class="article-list">
  <li><strong>Mathematics and physics</strong> for aviation engineering applications</li>
  <li><strong>Aircraft aerodynamics, structures, and systems</strong> covering fixed-wing principles and airframe design</li>
  <li><strong>Gas turbine engine theory</strong> and maintenance practices for modern powerplants</li>
  <li><strong>Digital techniques and electronic instrument systems</strong> including modern avionics</li>
  <li><strong>Aviation legislation and human factors</strong> ensuring safety-conscious maintenance practices</li>
  <li><strong>Materials, hardware, and maintenance procedures</strong> for practical workshop competency</li>
</ul>

<hr class="my-10 border-slate-200">

<h2 class="article-section-heading">Creating a Pipeline for the Accra MRO</h2>

<blockquote class="article-blockquote">"The completion of Phase 1 demonstrates the success of our training methodology. These graduates represent a new generation of African aviation professionals who can compete globally while strengthening their continent's technical capacity."</blockquote>
<p class="text-sm text-slate-500 mt-2">— Aerojet Aviation Leadership</p>

<p>These certified engineers are now eligible to work internationally while retaining employment opportunities with African airlines and MRO facilities. The achievement directly supports workforce needs of the planned MRO facility at Accra International Airport. The trainees now progress to Phase 2, including additional modules and extensive practical experience, moving closer to full EASA Part-66 B1 or B2 licence eligibility.</p>

<p class="article-source">Source: Aerojet Media, August 2025; LinkedIn posts by CEO Mazisi Parkes.</p>
    `),
    coverImage: '/images/newsroom/studentsafterpracticalsession.webp',
    tags: ['Training', 'EASA Part 66', 'Certification'],
    publishedAt: new Date('2025-08-15T10:00:00Z'),
    customAuthorName: 'Aerojet Communications',
  }

  await prisma.newsArticle.upsert({
    where: { slug: article.slug },
    update: {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      coverImage: article.coverImage,
      status: 'PUBLISHED',
      tags: article.tags,
      publishedAt: article.publishedAt,
      customAuthorName: article.customAuthorName,
      authorId: admin.id,
    },
    create: {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      coverImage: article.coverImage,
      status: 'PUBLISHED',
      tags: article.tags,
      publishedAt: article.publishedAt,
      customAuthorName: article.customAuthorName,
      authorId: admin.id,
    },
  })

  console.log(`  ✓ Article: "${article.title}"`)
  console.log('\n🎉 Article seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
