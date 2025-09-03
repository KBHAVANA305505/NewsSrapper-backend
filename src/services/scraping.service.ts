import axios from 'axios';
import crypto from 'crypto';
import { Article } from '../models'; // We only need the Article model here
import { logger } from '../utils/logger';

// Get the API key from environment variables
const newsApiKey = process.env.NEWS_API_KEY;

export interface ScrapedArticle {
  title: string;
  summary: string;
  content: string;
  images: Array<{
    url: string;
    alt: string;
    source: 'scraped';
  }>;
  category: string;
  tags: string[];
  author: string;
  lang: string;
  sourceUrl: string;
  publishedAt: Date;
  hash: string;
  sourceId: string;
  slug: string;
}

export class ScrapingService {
  
  // This method is now updated to use the News API
  public async scrapeSource(source: any): Promise<ScrapedArticle[]> {
    if (!newsApiKey) {
      logger.error('News API key is missing. Skipping scrape.');
      return [];
    }

    try {
      logger.info(`Scraping top headlines using News API for source: ${source.name}`);
      
      // We are changing the endpoint from /top-headlines to /everything
      // and searching for the keyword "bitcoin" to find new articles.
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: 'bitcoin',
          sortBy: 'publishedAt',
          language: 'en',
          apiKey: newsApiKey,
          pageSize: 20
        },
      });

      const articlesFromAPI = response.data.articles;
      const scrapedArticles: ScrapedArticle[] = [];

      for (const item of articlesFromAPI) {
        // Create a unique hash for each article to prevent duplicates
        const hash = this.generateHash(item.title + item.url);
        const existingArticle = await Article.findOne({ hash });

        // Ensure we have the essential data and the article is not a duplicate
        if (!existingArticle && item.title && item.url && item.content) {
          scrapedArticles.push({
            title: item.title,
            summary: item.description || '',
            content: item.content,
            images: item.urlToImage ? [{ url: item.urlToImage, alt: item.title, source: 'scraped' }] : [],
            // Assign the first category from the source by default
            category: source.categories[0], 
            tags: this.extractTagsFromTitle(item.title),
            author: item.author || source.name,
            lang: 'en', // Assuming News API returns English articles
            sourceUrl: item.url,
            publishedAt: new Date(item.publishedAt),
            hash: hash,
            sourceId: source._id.toString(),
            slug: this.generateSlug(item.title),
          });
        }
      }

      logger.info(`Successfully processed ${scrapedArticles.length} new articles from News API.`);
      return scrapedArticles;

    } catch (error: any) {
      // Log more detailed error from Axios if available
      if (error.response) {
        logger.error(`Error scraping with News API: ${error.response.status} - ${error.response.data.message}`);
      } else {
        logger.error('Error scraping source with News API', error);
      }
      return []; // Return empty array on failure
    }
  }

  // --- Helper Functions ---

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private extractTagsFromTitle(title: string): string[] {
    // A simple tag extractor based on the title
    const commonWords = new Set(['a', 'an', 'the', 'and', 'or', 'in', 'of', 'for', 'to', 'with']);
    return title.split(' ')
      .map(word => word.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5); // Take up to 5 keywords
  }
}