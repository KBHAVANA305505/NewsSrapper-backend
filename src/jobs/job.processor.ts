import { Job } from 'bullmq';
import { ScrapingService, ScrapedArticle } from '../services/scraping.service';
import { AIService } from '../services/ai.service';
import { PlagiarismService } from '../services/plagiarism.service';
import { Article, Source, Category, JobLog } from '../models';
import { logger } from '../utils/logger';
import { RewriteOptions } from '../services/ai.service'; 

const options: RewriteOptions = {
  tone: "neutral",
  length: "summary", 
  focusSeo: true,
  urgency: false,
};

export class JobProcessor {
  private scrapingService: ScrapingService;
  private aiService: AIService;
  private plagiarismService: PlagiarismService;

  constructor() {
    this.scrapingService = new ScrapingService();
    this.aiService = new AIService();
    this.plagiarismService = new PlagiarismService();
  }

  async processScrapingJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing scraping job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'scraping',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          sourceId: job.data.sourceId,
        },
      });
      await jobLog.save();

      // Get sources to scrape
      const sources = job.data.sourceId 
        ? await Source.find({ _id: job.data.sourceId, active: true })
        : await Source.find({ active: true });

      let totalArticles = 0;
      let successfulArticles = 0;

      for (const source of sources) {
        try {
          const scrapedArticles = await this.scrapingService.scrapeSource(source);
          totalArticles += scrapedArticles.length;

          // Process each scraped article
          for (const scrapedArticle of scrapedArticles) {
            try {
              await this.processScrapedArticle(scrapedArticle, source);
              successfulArticles++;
            } catch (error) {
              logger.error(`Error processing scraped article:`, error);
            }
          }

          // Update source last scraped time
          await Source.findByIdAndUpdate(source._id, { lastScraped: new Date() });
        } catch (error) {
          logger.error(`Error scraping source ${source.name}:`, error);
        }
      }

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        totalArticles,
        successfulArticles,
        sourcesProcessed: sources.length,
      };
      await jobLog.save();

      logger.info(`Scraping job completed. Processed ${successfulArticles}/${totalArticles} articles`);
      return { success: true, totalArticles, successfulArticles };
    } catch (error) {
      logger.error('Scraping job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processAIRewritingJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing AI rewriting job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'ai-rewriting',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Rewrite content with AI using enhanced options
      
      const rewriteOptions: RewriteOptions = {
        tone: article.category?.toString() === 'breaking' ? 'breaking' : 'neutral',
        length: 'summary',
        focusSeo: true,
        urgency: article.category?.toString() === 'breaking'
       };

      const aiResult = await this.aiService.rewriteArticle(
        article.content,
        article.title,
        rewriteOptions
      );

      // Update article with enhanced AI data
      article.content = aiResult.content;
      article.summary = aiResult.summary;
      article.title = aiResult.seoTitle || article.title;
      article.aiInfo.rewritten = aiResult.rewritten;
      article.aiInfo.confidence = aiResult.confidence;
      
      // Update SEO metadata
      if (aiResult.metaDescription) {
        article.seo = article.seo || {};
        article.seo.metaDescription = aiResult.metaDescription;
      }
      if (aiResult.keywords) {
        article.seo = article.seo || {};
        article.seo.keywords = aiResult.keywords;
      }
      if (aiResult.tags && aiResult.tags.length > 0) {
        article.tags = [...new Set([...article.tags, ...aiResult.tags])];
      }
      if (aiResult.author) {
        article.author = aiResult.author;
      }

      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        rewritten: aiResult.rewritten,
        confidence: aiResult.confidence,
        seoTitle: aiResult.seoTitle,
        metaDescription: aiResult.metaDescription,
        keywords: aiResult.keywords,
        tags: aiResult.tags,
        author: aiResult.author,
      };
      await jobLog.save();

      logger.info(`AI rewriting job completed for article: ${article.title}`);
      return { success: true, rewritten: aiResult.rewritten, confidence: aiResult.confidence };
    } catch (error) {
      logger.error('AI rewriting job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processPlagiarismJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing plagiarism job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'plagiarism-check',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Check plagiarism
      const plagiarismResult = await this.plagiarismService.checkPlagiarism(article.content, article.title);

      // Update article
      article.aiInfo.plagiarismScore = plagiarismResult.score;
      
      // Update status based on plagiarism score
      if (!plagiarismResult.approved) {
        article.status = 'rejected';
      }

      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        plagiarismScore: plagiarismResult.score,
        approved: plagiarismResult.approved,
        matches: plagiarismResult.matches.length,
      };
      await jobLog.save();

      logger.info(`Plagiarism check completed for article: ${article.title}. Score: ${plagiarismResult.score}%`);
      return { success: true, plagiarismScore: plagiarismResult.score, approved: plagiarismResult.approved };
    } catch (error) {
      logger.error('Plagiarism job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processModerationJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing moderation job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'moderation',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Moderate content
      const moderationResult = await this.aiService.moderateContent(article.content);

      // Update article status based on moderation
      if (!moderationResult.approved) {
        article.status = 'rejected';
      }

      await article.save();

      // Generate SEO metadata
      const seoResult = await this.aiService.generateSEO(article.title, article.content);
      article.seo = seoResult;
      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        approved: moderationResult.approved,
        reason: moderationResult.reason,
      };
      await jobLog.save();

      logger.info(`Content moderation completed for article: ${article.title}. Approved: ${moderationResult.approved}`);
      return { success: true, approved: moderationResult.approved, reason: moderationResult.reason };
    } catch (error) {
      logger.error('Moderation job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processPublishingJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing publishing job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'publishing',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Check if article can be published
      if (article.status === 'rejected') {
        throw new Error('Cannot publish rejected article');
      }

      if (article.aiInfo.plagiarismScore > 20) {
        throw new Error('Cannot publish article with high plagiarism score');
      }

      // Publish article
      article.status = 'published';
      article.publishedAt = new Date();
      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        publishedAt: article.publishedAt,
      };
      await jobLog.save();

      logger.info(`Article published successfully: ${article.title}`);
      return { success: true, publishedAt: article.publishedAt };
    } catch (error) {
      logger.error('Publishing job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processImageGenerationJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing image generation job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'image-generation',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Generate image prompt if no images exist
      if (!article.images || article.images.length === 0) {
        const imagePrompt = await this.aiService.generateImagePrompt(article.title, article.content);
        
        // Generate image using ZAI
        try {
          const { default: ZAI } = await import('z-ai-web-dev-sdk');
          const zai = await ZAI.create();

         
          const imageResponse = await zai.images.generations.create({
            prompt: imagePrompt,
            size: '1024x1024'
          });

          if (imageResponse.data && imageResponse.data[0]) {
            const base64Image = imageResponse.data[0].base64;
            const imageUrl = `data:image/png;base64,${base64Image}`;
            
            article.images = [{
              url: imageUrl,
              alt: article.title,
              caption: 'AI-generated image',
              width: 1024,
              height: 1024,
              generated: true
            }];
          }
        } catch (imageError) {
          logger.error('Image generation failed:', imageError);
        }
      }

      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        imagesGenerated: article.images?.length || 0,
      };
      await jobLog.save();

      logger.info(`Image generation job completed for article: ${article.title}`);
      return { success: true, imagesGenerated: article.images?.length || 0 };
    } catch (error) {
      logger.error('Image generation job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processFactCheckJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing fact-check job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'fact-check',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Perform fact-checking
      const factCheckResult = await this.aiService.factCheckContent(article.content);

      // Update article with fact-check results
      article.factCheck = {
        isReliable: factCheckResult.isReliable,
        confidence: factCheckResult.confidence,
        issues: factCheckResult.issues,
        suggestions: factCheckResult.suggestions,
        checkedAt: new Date()
      };

      // Update status if not reliable
      if (!factCheckResult.isReliable && factCheckResult.confidence > 70) {
        article.status = 'needs_review';
      }

      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        isReliable: factCheckResult.isReliable,
        confidence: factCheckResult.confidence,
        issuesFound: factCheckResult.issues.length,
      };
      await jobLog.save();

      logger.info(`Fact-check job completed for article: ${article.title}. Reliable: ${factCheckResult.isReliable}`);
      return { success: true, ...factCheckResult };
    } catch (error) {
      logger.error('Fact-check job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processSocialMediaJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing social media job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'social-media',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
          platforms: job.data.platforms || ['twitter', 'linkedin', 'facebook'],
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Generate social media posts
      const platforms = job.data.platforms || ['twitter', 'linkedin', 'facebook'];
      const socialPosts = await this.aiService.generateSocialMediaPosts(
        article.title, 
        article.content, 
        platforms as ('twitter' | 'linkedin' | 'facebook')[]
      );

      // Update article with social media posts
      article.socialMedia = {
        posts: socialPosts,
        generatedAt: new Date()
      };

      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        platforms: Object.keys(socialPosts),
        postsGenerated: Object.keys(socialPosts).length,
      };
      await jobLog.save();

      logger.info(`Social media job completed for article: ${article.title}`);
      return { success: true, posts: socialPosts };
    } catch (error) {
      logger.error('Social media job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  async processTranslationJob(job: Job) {
    const startTime = new Date();
    let jobLog: any;

    try {
      logger.info(`Processing translation job: ${job.id}`);

      // Create job log
      jobLog = new JobLog({
        jobType: 'translation',
        status: 'running',
        startTime,
        meta: {
          jobId: job.id!,
          articleId: job.data.articleId,
          targetLanguage: job.data.targetLanguage,
        },
      });
      await jobLog.save();

      // Get article
      const article = await Article.findById(job.data.articleId);
      if (!article) {
        throw new Error('Article not found');
      }

      // Translate content
      const translationResult = await this.aiService.translateContent(
        article.content, 
        job.data.targetLanguage
      );

      // Create translated version
      const translatedArticle = {
        title: `${article.title} (${job.data.targetLanguage})`,
        content: translationResult.translated,
        summary: this.generateSummary(translationResult.translated),
        originalArticleId: article._id,
        language: job.data.targetLanguage,
        translationConfidence: translationResult.confidence,
        translatedAt: new Date()
      };

      // Save translated article (you might want to create a separate model for translations)
      // For now, we'll store it in the original article's translations array
      if (!article.translations) {
        article.translations = [];
      }
      article.translations.push(translatedArticle);

      await article.save();

      // Update job log
      jobLog.status = 'completed';
      jobLog.endTime = new Date();
      jobLog.meta = {
        ...jobLog.meta,
        targetLanguage: job.data.targetLanguage,
        confidence: translationResult.confidence,
      };
      await jobLog.save();

      logger.info(`Translation job completed for article: ${article.title} to ${job.data.targetLanguage}`);
      return { success: true, ...translationResult };
    } catch (error) {
      logger.error('Translation job error:', error);

      // Update job log with error
      if (jobLog) {
        jobLog.status = 'failed';
        jobLog.endTime = new Date();
        jobLog.meta = {
          ...jobLog.meta,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        await jobLog.save();
      }

      throw error;
    }
  }

  private async processScrapedArticle(scrapedArticle: ScrapedArticle, source: any) {
    try {
      // Create article draft
      const article = new Article({
        title: scrapedArticle.title,
        summary: scrapedArticle.summary,
        content: scrapedArticle.content,
        images: scrapedArticle.images,
        category: scrapedArticle.category,
        tags: scrapedArticle.tags,
        author: scrapedArticle.author,
        lang: scrapedArticle.lang,
        sourceId: source._id,
        status: 'draft',
        hash: scrapedArticle.hash,
        publishedAt: scrapedArticle.publishedAt,
      });

      await article.save();

      // Queue AI rewriting job
      // This will be handled by the job queue system
      logger.info(`Created article draft: ${article.title}`);

      return article;
    } catch (error) {
      logger.error('Process scraped article error:', error);
      throw error;
    }
  }

  private generateSummary(content: string): string {
    // Simple extractive summarization
    const sentences = content.split('.').filter(s => s.trim().length > 0);
    if (sentences.length <= 2) {
      return content;
    }
    
    // Return first two sentences as summary
    return sentences.slice(0, 2).join('. ') + '.';
  }
}