import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/PageHero';
import { client } from '../../sanity/lib/client'; // Import the client
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Newsroom',
};
import { urlFor } from '../../sanity/lib/image';  // Import the image helper

// Define the type for our article data
interface Article {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage: any;
  category: string;
  publishedAt: string;
}

// Fetch the data from Sanity
async function getArticles() {
  const query = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    mainImage,
    category,
    publishedAt
  }`;
  const articles = await client.fetch(query);
  return articles;
}


export default async function NewsroomPage() {
  const articles: Article[] = await getArticles();

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Newsroom"
          subtitle="The latest announcements, updates, and stories from Aerojet Academy."
          backgroundImage="/lecturer2.jpg"
        />
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link href={`/news/${article.slug.current}`} key={article._id} className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative h-56 w-full bg-gray-200">
                  <Image 
                    src={urlFor(article.mainImage).url()} // Use urlFor to get the image URL
                    alt={`Image for ${article.title}`} 
                    layout="fill" 
                    objectFit="contain" 
                    className="p-2" 
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-aerojet-sky uppercase mb-2">
                    {article.category} - {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                  <h3 className="text-lg font-bold text-aerojet-blue mb-3 leading-snug">{article.title}</h3>
                  <span className="font-semibold text-sm text-aerojet-sky group-hover:text-aerojet-blue transition">Read More →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
