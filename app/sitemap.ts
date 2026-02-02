import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aerojet-academy.com'; // Change this to your actual domain later

  // Define your static routes
  const routes = [
    '',
    '/about',
    '/courses',
    '/courses/easa-full-time',
    '/courses/easa-modular',
    '/courses/modules',
    '/courses/pilot-training',
    '/courses/cabin-crew',
    '/admissions',
    '/admissions/entry-requirements',
    '/admissions/fees',
    '/news',
    '/contact',
    '/legal/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
