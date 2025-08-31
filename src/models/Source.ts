import mongoose, { Document, Schema } from 'mongoose';

export interface ISource extends Document {
  name: string;
  url: string;
  rssUrls: string[];
  lang: string;
  categories: mongoose.Types.ObjectId[];
  active: boolean;
  lastScraped?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sourceSchema = new Schema<ISource>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  rssUrls: [{
    type: String,
    trim: true,
    required: true
  }],
  lang: {
    type: String,
    required: true,
    default: 'en'
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  active: {
    type: Boolean,
    default: true
  },
  lastScraped: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes
sourceSchema.index({ active: 1, lang: 1 });
sourceSchema.index({ categories: 1 });
sourceSchema.index({ lastScraped: 1 });

export const Source = mongoose.model<ISource>('Source', sourceSchema);