import { MetadataRoute } from 'next';
import { getSiteUrl } from '../lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}

