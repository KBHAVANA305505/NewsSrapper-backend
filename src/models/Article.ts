import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IArticle extends Document {
  title: string;
  slug: string;
  summary: string;
  content: string;
  images: Array<{
    url: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
    generated?: boolean;
  }>;
  category: mongoose.Types.ObjectId;
  tags: string[];
  author: string;
  lang: string;
  sourceId: mongoose.Types.ObjectId;
  status: 'draft' | 'published' | 'rejected' | 'needs_review';
  aiInfo: {
    rewritten: boolean;
    confidence: number;
    plagiarismScore: number;
  };
  seo: {
    metaDescription: string;
    keywords: string[];
  };
  factCheck?: {
    isReliable: boolean;
    confidence: number;
    issues: string[];
    suggestions: string[];
    checkedAt: Date;
  };
  socialMedia?: {
    posts: { [platform: string]: string };
    generatedAt: Date;
  };
  translations?: Array<{
    title: string;
    content: string;
    summary: string;
    language: string;
    translationConfidence: number;
    translatedAt: Date;
  }>;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  hash: string;
}

const articleSchema = new Schema<IArticle>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  images: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    alt: {
      type: String,
      required: true,
      trim: true
    },
    caption: {
      type: String,
      trim: true
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    generated: {
      type: Boolean,
      default: false
    }
  }],
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    required: true,
    trim: true
  },
  lang: {
    type: String,
    required: true,
    default: 'en'
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    ref: 'Source',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'rejected', 'needs_review'],
    default: 'draft'
  },
  aiInfo: {
    rewritten: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      default: 0
    },
    plagiarismScore: {
      type: Number,
      default: 0
    }
  },
  seo: {
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },
  factCheck: {
    isReliable: {
      type: Boolean,
      default: true
    },
    confidence: {
      type: Number,
      default: 50
    },
    issues: [{
      type: String,
      trim: true
    }],
    suggestions: [{
      type: String,
      trim: true
    }],
    checkedAt: {
      type: Date,
      default: Date.now
    }
  },
  socialMedia: {
    posts: {
      type: Map,
      of: String
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  translations: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      required: true,
      trim: true
    },
    translationConfidence: {
      type: Number,
      default: 0
    },
    translatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  publishedAt: {
    type: Date
  },
  viewCount: {
    type: Number,
    default: 0
  },
  hash: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Generate slug before saving
articleSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Create indexes

articleSchema.index({ category: 1, status: 1, publishedAt: -1 });
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ lang: 1, status: 1 });
articleSchema.index({ tags: 1 });

articleSchema.index({ viewCount: -1 });

export const Article = mongoose.model<IArticle>('Article', articleSchema);