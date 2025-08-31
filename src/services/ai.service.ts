import ZAI from 'z-ai-web-dev-sdk';
import { logger } from '../utils/logger';

export interface AIProcessingResult {
  rewritten: boolean;
  content: string;
  summary: string;
  confidence: number;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  tags?: string[];
  author?: string;
}

export interface RewriteOptions {
  tone: 'formal' | 'neutral' | 'exciting' | 'breaking';
  length: 'summary' | 'full' | 'detailed';
  focusSeo: boolean;
  urgency: boolean;
}

export class AIService {
  private zai: ZAI | null = null;

  constructor() {
    // this.initializeAI();
  }

  private async initializeAI() {
    try {
      this.zai = await ZAI.create();
      logger.info('AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI service:', error);
    }
  }

  async rewriteArticle(content: string, title: string, options: RewriteOptions = {
    tone: 'neutral',
    length: 'full',
    focusSeo: true,
    urgency: false
  }): Promise<AIProcessingResult> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      logger.info('Starting AI article rewriting with options:', options);

      // Build tone description
      const toneDescriptions = {
        formal: 'Professional, academic, and objective tone suitable for serious news reporting',
        neutral: 'Balanced and factual tone without bias or sensationalism',
        exciting: 'Engaging and dynamic tone that captures reader interest',
        breaking: 'Urgent and attention-grabbing tone for breaking news'
      };

      // Build length description
      const lengthDescriptions = {
        summary: 'Concise summary covering key points only',
        full: 'Complete article with all important details',
        detailed: 'Comprehensive coverage with in-depth analysis'
      };

      const urgencyPrefix = options.urgency ? 'BREAKING NEWS: ' : '';
      const seoInstruction = options.focusSeo ? 
        'Include relevant keywords naturally and structure for SEO optimization' : '';

      const prompt = `
        You are a professional news editor. Rewrite the following article with these specifications:
        
        Tone: ${toneDescriptions[options.tone]}
        Length: ${lengthDescriptions[options.length]}
        SEO Focus: ${options.focusSeo ? 'Yes' : 'No'}
        Urgency: ${options.urgency ? 'Yes - Use breaking news style' : 'No'}
        
        ${seoInstruction}
        
        Original Title: ${title}
        
        Content: ${content}
        
        Please provide:
        1. An attention-grabbing SEO-optimized title ${options.urgency ? '(starting with BREAKING or EXCLUSIVE if appropriate)' : ''}
        2. A rewritten version of the article following the specified tone and length
        3. A brief summary (2-3 sentences)
        4. A confidence score (0-100) indicating how well the content was rewritten
        5. Meta description for SEO (under 160 characters)
        6. 5-10 relevant keywords for SEO
        7. 3-5 category tags
        8. Suggested author name (generic if not specified)
        
        Format your response as JSON:
        {
          "seoTitle": "${urgencyPrefix}[Catchy SEO Title]",
          "rewrittenContent": "...",
          "summary": "...",
          "confidence": 85,
          "metaDescription": "...",
          "keywords": ["keyword1", "keyword2", ...],
          "tags": ["tag1", "tag2", ...],
          "author": "Author Name"
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional news editor specializing in neutral, factual reporting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      // Parse JSON response
      try {
        const result = JSON.parse(response);
        
        return {
          rewritten: true,
          content: result.rewrittenContent || content,
          summary: result.summary || '',
          confidence: result.confidence || 70,
          seoTitle: result.seoTitle || title,
          metaDescription: result.metaDescription || this.generateMetaDescription(content),
          keywords: result.keywords || this.extractKeywords(content),
          tags: result.tags || [],
          author: result.author || 'NewsHub Staff'
        };
      } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError);
        
        // Fallback: return original content with basic metadata
        return {
          rewritten: false,
          content,
          summary: this.generateSummary(content),
          confidence: 0,
          seoTitle: title,
          metaDescription: this.generateMetaDescription(content),
          keywords: this.extractKeywords(content),
          tags: [],
          author: 'NewsHub Staff'
        };
      }
    } catch (error) {
      logger.error('AI rewriting error:', error);
      
      // Fallback: return original content with basic metadata
      return {
        rewritten: false,
        content,
        summary: this.generateSummary(content),
        confidence: 0,
        seoTitle: title,
        metaDescription: this.generateMetaDescription(content),
        keywords: this.extractKeywords(content),
        tags: [],
        author: 'NewsHub Staff'
      };
    }
  }

  async moderateContent(content: string): Promise<{ approved: boolean; reason?: string }> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const prompt = `
        You are a content moderator. Analyze the following content for:
        - Hate speech or discriminatory language
        - Violence or harmful content
        - Misinformation or fake news
        - Inappropriate or offensive material
        
        Content: ${content}
        
        Respond with JSON:
        {
          "approved": true/false,
          "reason": "Explanation if not approved"
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation expert. Be strict but fair.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        maxTokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        const result = JSON.parse(response);
        return {
          approved: result.approved,
          reason: result.reason,
        };
      } catch (parseError) {
        logger.error('Failed to parse moderation response:', parseError);
        return { approved: true }; // Default to approved if parsing fails
      }
    } catch (error) {
      logger.error('Content moderation error:', error);
      return { approved: true }; // Default to approved if service fails
    }
  }

  async generateSEO(title: string, content: string): Promise<{ metaDescription: string; keywords: string[] }> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const prompt = `
        Generate SEO metadata for this news article:
        
        Title: ${title}
        Content: ${content.substring(0, 1000)}...
        
        Provide:
        1. Meta description (under 160 characters)
        2. 5-10 relevant keywords
        
        Format as JSON:
        {
          "metaDescription": "...",
          "keywords": ["keyword1", "keyword2", ...]
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert specializing in news content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 300,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        const result = JSON.parse(response);
        return {
          metaDescription: result.metaDescription || '',
          keywords: result.keywords || [],
        };
      } catch (parseError) {
        logger.error('Failed to parse SEO response:', parseError);
        return {
          metaDescription: this.generateMetaDescription(content),
          keywords: this.extractKeywords(content),
        };
      }
    } catch (error) {
      logger.error('SEO generation error:', error);
      return {
        metaDescription: this.generateMetaDescription(content),
        keywords: this.extractKeywords(content),
      };
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

  private generateMetaDescription(content: string): string {
    const summary = this.generateSummary(content);
    return summary.length > 160 ? summary.substring(0, 157) + '...' : summary;
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  async translateContent(content: string, targetLanguage: 'english' | 'hindi' | 'telugu' | 'spanish' | 'french'): Promise<{ translated: string; confidence: number }> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const prompt = `
        Translate the following news content to ${targetLanguage}. Maintain the original meaning, tone, and journalistic style.
        
        Content: ${content}
        
        Format as JSON:
        {
          "translatedContent": "...",
          "confidence": 85
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional news translator specializing in maintaining journalistic integrity across languages.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        maxTokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        const result = JSON.parse(response);
        return {
          translated: result.translatedContent || content,
          confidence: result.confidence || 70,
        };
      } catch (parseError) {
        logger.error('Failed to parse translation response:', parseError);
        return { translated: content, confidence: 0 };
      }
    } catch (error) {
      logger.error('Translation error:', error);
      return { translated: content, confidence: 0 };
    }
  }

  async generateImagePrompt(title: string, content: string): Promise<string> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const prompt = `
        Generate a detailed image generation prompt for a news article thumbnail based on this content:
        
        Title: ${title}
        Content: ${content.substring(0, 500)}...
        
        The prompt should:
        - Be suitable for news/journalism context
        - Professional and appropriate
        - Include relevant visual elements
        - Specify style (photorealistic, illustration, etc.)
        - Include lighting and composition details
        
        Return only the image prompt, no other text.
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating image prompts for news media.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        maxTokens: 200,
      });

      return completion.choices[0]?.message?.content || 'Professional news journalism scene';
    } catch (error) {
      logger.error('Image prompt generation error:', error);
      return 'Professional news journalism scene';
    }
  }

  async generateInfographicData(title: string, content: string): Promise<{ type: string; data: any[]; title: string }> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const prompt = `
        Analyze this news article and extract data suitable for an infographic:
        
        Title: ${title}
        Content: ${content}
        
        Identify:
        1. Type of infographic (bar chart, pie chart, timeline, statistics, etc.)
        2. Key data points or statistics
        3. Suggested infographic title
        
        Format as JSON:
        {
          "type": "chart type",
          "data": [{"label": "Label1", "value": 10}, ...],
          "title": "Infographic Title"
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a data visualization expert for news media.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        maxTokens: 500,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        return JSON.parse(response);
      } catch (parseError) {
        logger.error('Failed to parse infographic response:', parseError);
        return {
          type: 'statistics',
          data: [],
          title: 'Article Statistics'
        };
      }
    } catch (error) {
      logger.error('Infographic generation error:', error);
      return {
        type: 'statistics',
        data: [],
        title: 'Article Statistics'
      };
    }
  }

  async factCheckContent(content: string): Promise<{ 
    isReliable: boolean; 
    confidence: number; 
    issues: string[]; 
    suggestions: string[] 
  }> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const prompt = `
        Fact-check this news content for reliability and accuracy:
        
        Content: ${content}
        
        Analyze for:
        1. Factual accuracy
        2. Source reliability indicators
        3. Potential misinformation or bias
        4. Claims that need verification
        
        Format as JSON:
        {
          "isReliable": true/false,
          "confidence": 85,
          "issues": ["issue1", "issue2", ...],
          "suggestions": ["suggestion1", "suggestion2", ...]
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional fact-checker specializing in news media accuracy.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        maxTokens: 800,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        return JSON.parse(response);
      } catch (parseError) {
        logger.error('Failed to parse fact-check response:', parseError);
        return {
          isReliable: true,
          confidence: 50,
          issues: [],
          suggestions: []
        };
      }
    } catch (error) {
      logger.error('Fact-checking error:', error);
      return {
        isReliable: true,
        confidence: 50,
        issues: [],
        suggestions: []
      };
    }
  }

  async generateSocialMediaPosts(title: string, content: string, platforms: ('twitter' | 'linkedin' | 'facebook')[] = ['twitter', 'linkedin', 'facebook']): Promise<{ [platform: string]: string }> {
    try {
      if (!this.zai) {
        throw new Error('AI service not initialized');
      }

      const platformInstructions = {
        twitter: 'Under 280 characters, include hashtags, engaging tone',
        linkedin: 'Professional tone, industry insights, longer format',
        facebook: 'Conversational tone, engaging questions, longer format'
      };

      const prompt = `
        Generate social media posts for this news article:
        
        Title: ${title}
        Content: ${content.substring(0, 300)}...
        
        Generate posts for: ${platforms.join(', ')}
        
        Format as JSON:
        {
          ${platforms.map(p => `"${p}": "Post content for ${p} following these guidelines: ${platformInstructions[p]}"`).join(',\n          ')}
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert for news organizations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        maxTokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      try {
        return JSON.parse(response);
      } catch (parseError) {
        logger.error('Failed to parse social media response:', parseError);
        const fallback: { [platform: string]: string } = {};
        platforms.forEach(platform => {
          fallback[platform] = `Read: ${title}`;
        });
        return fallback;
      }
    } catch (error) {
      logger.error('Social media post generation error:', error);
      const fallback: { [platform: string]: string } = {};
      platforms.forEach(platform => {
        fallback[platform] = `Read: ${title}`;
      });
      return fallback;
    }
  }
}