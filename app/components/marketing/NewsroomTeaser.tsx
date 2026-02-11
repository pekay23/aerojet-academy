import Link from 'next/link';
import Image from 'next/image';
import { client } from '@/sanity/lib/client'; 
import { urlFor } from '@/sanity/lib/image'; 

interface ArticleTeaser {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage: {
    asset: {
      _ref: string;
      _type: 'reference';
    };
  };
  category: string;
}

async function getLatestArticles() {
  const query = `*[_type == "article"] | order(publishedAt desc)[0...3] {
    _id,
    title,
    slug,
    mainImage,
    category
  }`;
  const articles = await client.fetch(query);
  return articles;
}

export default async function NewsroomTeaser() {
  const articles: ArticleTeaser[] = await getLatestArticles();

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-aerojet-blue mb-4">
            Latest News & Updates
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay informed about our progress, partnerships, and program announcements.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link href={`/news/${article.slug.current}`} key={article._id} className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative h-56 w-full bg-gray-200">
                <Image
                  src={urlFor(article.mainImage).url()}
                  alt={`Image for ${article.title}`}
                  layout="fill"
                  objectFit="contain"
                  className="p-2"
                />
              </div>
              <div className="p-6">
                <p className="text-xs font-bold text-aerojet-sky uppercase mb-2">{article.category}</p>
                <h3 className="text-lg font-bold text-aerojet-blue mb-3 leading-snug">
                  {article.title}
                </h3>
                <span className="font-semibold text-sm text-aerojet-sky group-hover:text-aerojet-blue transition">Read More →</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/news" className="border-2 border-aerojet-blue text-aerojet-blue px-10 py-3 rounded-md font-bold hover:bg-aerojet-blue hover:text-white! transition">
            View All News
          </Link>
        </div>
      </div>
    </section>
  );
}
