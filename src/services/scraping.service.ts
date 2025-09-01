import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Source, Article, Category } from '../models';
import { logger } from '../utils/logger';

export interface ScrapedArticle {
  title: string;
  summary: string;
  content: string;
  images: Array<{
    url: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
    source: 'scraped' | 'opengraph' | 'ai_generated';
  }>;
  category: string;
  tags: string[];
  author: string;
  lang: string;
  sourceUrl: string;
  publishedAt: Date;
  hash: string;
  openGraph?: {
    image?: string;
    title?: string;
    description?: string;
  };
  sourceId: string;
  slug: string;
}

export class ScrapingService {
  private rssParser: Parser;

  constructor() {
    this.rssParser = new Parser();
  }

  async scrapeAllSources(): Promise<void> {
    try {
      logger.info('Starting scraping for all sources');
      
      const sources = await Source.find({ active: true }).populate('categories');
      logger.info(`Found ${sources.length} active sources.`);

      for (const source of sources) {
        try {
          if (!source.categories || source.categories.length === 0) {
            logger.warn(`Source "${source.name}" has no categories. Skipping article scraping.`);
            continue; 
          }
          
          // Note: The job processor will handle the result of scrapeSource.
          // This method just triggers the process for all.
          await this.scrapeSource(source);
          
          await Source.findByIdAndUpdate(source._id, { lastScraped: new Date() });
        } catch (error) {
          logger.error(`Error scraping source ${source.name}:`, error);
        }
      }

      logger.info(`Scraping completed.`);
    } catch (error) {
      logger.error('Scrape all sources error:', error);
      throw error;
    }
  }

  
  async scrapeSource(source: any): Promise<ScrapedArticle[]> {
    const successfullyScrapedArticles: ScrapedArticle[] = [];
    try {
      logger.info(`Scraping source: ${source.name}`);
      
      for (const rssUrl of source.rssUrls) {
        try {
          const feed = await this.rssParser.parseURL(rssUrl);
          
          for (const item of feed.items) {
            try {
              const scrapedArticle = await this.scrapeArticle(item, source);
              if (scrapedArticle) {
                // FIX: Add valid articles to the array instead of saving here
                successfullyScrapedArticles.push(scrapedArticle);
              }
            } catch (error) {
              logger.error(`Error processing article item from ${source.name}:`, error);
            }
          }
        } catch (error) {
          logger.error(`Error parsing RSS feed ${rssUrl}:`, error);
        }
      }

      logger.info(`Scraped ${successfullyScrapedArticles.length} articles from ${source.name}`);
      // FIX: Return the array of scraped articles
      return successfullyScrapedArticles;
    } catch (error) {
      logger.error(`Scrape source error for ${source.name}:`, error);
      throw error;
    }
  }

  async scrapeArticle(item: any, source: any): Promise<ScrapedArticle | null> {
    try {
      const title = item.title || '';
      const link = item.link || '';
      const summary = item.contentSnippet || item.summary || '';
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      if (!title || !link) {
        return null;
      }
      
      const hash = this.generateHash(title + link);
      
      const existingArticle = await Article.findOne({ hash });
      if (existingArticle) {
        logger.debug(`Duplicate article found, skipping: ${title}`);
        return null;
      }

      const fullContent = await this.fetchArticleContent(link);
      const openGraphData = await this.extractOpenGraphData(link);
      const images = this.extractImages(fullContent, link, openGraphData);
      
      if (images.length === 0 && openGraphData.image) {
        images.push({
          url: openGraphData.image,
          alt: title,
          caption: 'Open Graph image',
          source: 'opengraph'
        });
      }
      
      const category = await this.determineCategory(title, summary, source.categories);
      const tags = this.extractTags(title, summary, fullContent);
      const slug = this.generateSlug(title);
      const sourceId = source._id.toString();

      return {
        title,
        summary: summary.substring(0, 300),
        content: this.cleanContent(fullContent),
        images,
        category: category._id.toString(),
        tags,
        author: this.extractAuthor(fullContent) || source.name,
        lang: source.lang,
        sourceUrl: link,
        publishedAt,
        hash,
        sourceId, 
        slug, 
        openGraph: openGraphData
      };
    } catch (error) {
      logger.error('Scrape article error:', error);
      return null;
    }
  }
  
  // --- Helper Functions ---

  private generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
  }

  private async fetchArticleContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsHub/1.0; +https://newshub.com)',
        },
      });

      const $ = cheerio.load(response.data);
      
      $('script, style, nav, header, footer, .ads, .advertisement, .comments').remove();
      
      let content = '';
      
      const contentSelectors = [
        'article', '.article', '.content', '.post-content', 
        '.entry-content', '.story-content', 'main', 
        '.main-content', '#content',
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.html() || '';
          if (content) break;
        }
      }

      if (!content) {
        content = $('body').html() || '';
      }

      return this.cleanContent(content);
    } catch (error) {
      logger.error(`Fetch article content error for ${url}:`, error);
      return '';
    }
  }

  private extractImages(html: string, baseUrl: string, openGraphData?: any): Array<{
    url: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
    source: 'scraped' | 'opengraph' | 'ai_generated';
  }> {
    try {
      const $ = cheerio.load(html);
      const images: Array<{
        url: string;
        alt: string;
        caption?: string;
        width?: number;
        height?: number;
        source: 'scraped' | 'opengraph' | 'ai_generated';
      }> = [];

      $('img').each((_, element) => {
        const src = $(element).attr('src');
        const alt = $(element).attr('alt') || 'Article image';
        const width = parseInt($(element).attr('width') || '0');
        const height = parseInt($(element).attr('height') || '0');
        
        if (src) {
          const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
          
          if (width > 50 && height > 50) {
            images.push({
              url: fullUrl,
              alt,
              width,
              height,
              source: 'scraped'
            });
          }
        }
      });

      return [...new Map(images.map(img => [img.url, img])).values()].slice(0, 5);
    } catch (error) {
      logger.error('Extract images error:', error);
      return [];
    }
  }

  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async extractOpenGraphData(url: string): Promise<{
    image?: string;
    title?: string;
    description?: string;
  }> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NewsHub/1.0; +https://newshub.com)',
        },
      });

      const $ = cheerio.load(response.data);
      const openGraphData: {
        image?: string;
        title?: string;
        description?: string;
      } = {};

      $('meta[property^="og:"]').each((_, element) => {
        const property = $(element).attr('property');
        const content = $(element).attr('content');
        
        if (property && content) {
          switch (property) {
            case 'og:image':
              openGraphData.image = content;
              break;
            case 'og:title':
              openGraphData.title = content;
              break;
            case 'og:description':
              openGraphData.description = content;
              break;
          }
        }
      });

      $('meta[name^="twitter:"]').each((_, element) => {
        const name = $(element).attr('name');
        const content = $(element).attr('content');
        
        if (name && content) {
          switch (name) {
            case 'twitter:image':
              if (!openGraphData.image) openGraphData.image = content;
              break;
            case 'twitter:title':
              if (!openGraphData.title) openGraphData.title = content;
              break;
            case 'twitter:description':
              if (!openGraphData.description) openGraphData.description = content;
              break;
          }
        }
      });

      return openGraphData;
    } catch (error) {
      logger.error(`Extract Open Graph data error for ${url}:`, error);
      return {};
    }
  }

  private async determineCategory(title: string, summary: string, sourceCategories: any[]): Promise<any> {
    try {
      const text = (title + ' ' + summary).toLowerCase();
      
      const categoryKeywords = {
        'politics': ['politics', 'government', 'election', 'president', 'congress', 'senate', 'democrat', 'republican'],
        'sports': ['sports', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'olympics', 'game', 'match'],
        'tech': ['technology', 'tech', 'software', 'hardware', 'ai', 'artificial intelligence', 'computer', 'internet'],
        'health': ['health', 'medical', 'doctor', 'hospital', 'medicine', 'disease', 'treatment', 'patient'],
        'world': ['world', 'international', 'global', 'united nations', 'foreign', 'overseas'],
        'business': ['business', 'economy', 'market', 'stock', 'finance', 'money', 'company', 'corporation'],
        'entertainment': ['entertainment', 'movie', 'film', 'music', 'celebrity', 'hollywood', 'tv', 'television'],
        'science': ['science', 'research', 'study', 'discovery', 'scientist', 'experiment', 'innovation'],
      };

      for (const [categoryKey, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
          const category = await Category.findOne({ key: categoryKey });
          if (category) {
            return category;
          }
        }
      }

      if (sourceCategories && sourceCategories.length > 0) {
        return sourceCategories[0];
      }

      const generalCategory = await Category.findOne({ key: 'general' }) || await Category.findOne();
      return generalCategory;
    } catch (error) {
      logger.error('Determine category error:', error);
      throw error;
    }
  }

  private extractTags(title: string, summary: string, content: string): string[] {
    try {
      const text = (title + ' ' + summary + ' ' + content).toLowerCase();
      const tags: string[] = [];

      const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
      
      const words = text.match(/\b(\w{4,})\b/g) || [];
      
      const wordCount: { [key: string]: number } = {};
      words.forEach(word => {
        if (!commonWords.has(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });

      const sortedWords = Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

      return sortedWords;
    } catch (error) {
      logger.error('Extract tags error:', error);
      return [];
    }
  }

  private extractAuthor(content: string): string | null {
    try {
      const $ = cheerio.load(content);
      const authorSelectors = [
          '.author', '[rel="author"]', '[itemprop="author"]', 
          'a[href*="/author/"]', '.byline'
      ];
      for (const selector of authorSelectors) {
          const authorText = $(selector).first().text().trim();
          if (authorText) {
              return authorText.replace(/by/i, '').trim();
          }
      }
      return null;
    } catch (error) {
      logger.error('Extract author error:', error);
      return null;
    }
  }

  private cleanContent(html: string): string {
    try {
      const $ = cheerio.load(html);
      
      $('script, style, nav, header, footer, .ads, .advertisement, .comments, .social-share, .related-articles').remove();
      
      let text = $('body').text();
      
      text = text.replace(/\s+/g, ' ').trim();
      text = text.replace(/\n\s*\n/g, '\n\n');
      
      return text;
    } catch (error) {
      logger.error('Clean content error:', error);
      return html;
    }
  }
}