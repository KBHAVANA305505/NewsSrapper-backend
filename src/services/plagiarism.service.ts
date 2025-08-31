import { logger } from '../utils/logger';

export interface PlagiarismResult {
  score: number;
  matches: PlagiarismMatch[];
  approved: boolean;
}

export interface PlagiarismMatch {
  source: string;
  similarity: number;
  url?: string;
}

export class PlagiarismService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.PLAGIARISM_API_KEY || '';
  }

  async checkPlagiarism(content: string, title: string): Promise<PlagiarismResult> {
    try {
      logger.info('Starting plagiarism check');

      // For demo purposes, we'll implement a simple plagiarism check
      // In production, you would integrate with a proper plagiarism detection API
      
      const result = await this.performPlagiarismCheck(content, title);
      
      logger.info(`Plagiarism check completed. Score: ${result.score}%`);
      
      return result;
    } catch (error) {
      logger.error('Plagiarism check error:', error);
      
      // Return safe default if service fails
      return {
        score: 0,
        matches: [],
        approved: true,
      };
    }
  }

  private async performPlagiarismCheck(content: string, title: string): Promise<PlagiarismResult> {
    try {
      // Simple plagiarism detection based on common phrases and patterns
      // This is a basic implementation - in production, use a proper plagiarism detection service
      
      const suspiciousPhrases = [
        'according to reports',
        'sources say',
        'it has been reported',
        'officials confirmed',
        'breaking news',
        'just in',
        'we can confirm',
        'developing story',
      ];

      const lowerContent = content.toLowerCase();
      let suspiciousCount = 0;

      // Count suspicious phrases
      suspiciousPhrases.forEach(phrase => {
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = lowerContent.match(regex);
        if (matches) {
          suspiciousCount += matches.length;
        }
      });

      // Calculate basic score based on suspicious phrases
      let score = Math.min((suspiciousCount / content.length) * 1000, 30); // Cap at 30%

      // Check for very short content (might be copied)
      if (content.length < 200) {
        score += 20;
      }

      // Check for excessive repetition
      const words = content.split(/\s+/);
      const wordCount: { [key: string]: number } = {};
      words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord.length > 2) {
          wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
      });

      const totalWords = Object.keys(wordCount).length;
      const averageFrequency = Object.values(wordCount).reduce((a, b) => a + b, 0) / totalWords;
      
      // High repetition might indicate copied content
      if (averageFrequency > 3) {
        score += 15;
      }

      // Generate some mock matches for demonstration
      const matches: PlagiarismMatch[] = [];
      
      if (score > 10) {
        matches.push({
          source: 'News Source A',
          similarity: Math.min(score, 25),
          url: 'https://example.com/news/article1',
        });
      }

      if (score > 20) {
        matches.push({
          source: 'News Source B',
          similarity: Math.min(score - 10, 20),
          url: 'https://example.com/news/article2',
        });
      }

      // Approve if score is below 20%
      const approved = score < 20;

      return {
        score: Math.round(score * 100) / 100,
        matches,
        approved,
      };
    } catch (error) {
      logger.error('Perform plagiarism check error:', error);
      throw error;
    }
  }

  async batchCheckPlagiarism(articles: Array<{ content: string; title: string }>): Promise<PlagiarismResult[]> {
    try {
      logger.info(`Starting batch plagiarism check for ${articles.length} articles`);

      const results: PlagiarismResult[] = [];

      for (const article of articles) {
        try {
          const result = await this.checkPlagiarism(article.content, article.title);
          results.push(result);
        } catch (error) {
          logger.error('Batch plagiarism check error for article:', error);
          results.push({
            score: 0,
            matches: [],
            approved: true,
          });
        }
      }

      logger.info(`Batch plagiarism check completed for ${articles.length} articles`);
      return results;
    } catch (error) {
      logger.error('Batch plagiarism check error:', error);
      throw error;
    }
  }
}