import mongoose, { Document, Schema } from 'mongoose';

export interface IJobLog extends Document {
  jobType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  meta: {
    sourceId?: string;
    articleId?: string;
    error?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const jobLogSchema = new Schema<IJobLog>({
  jobType: {
    type: String,
    required: true,
    enum: ['scraping', 'ai-rewriting', 'plagiarism-check', 'moderation', 'publishing']
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  meta: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Calculate duration before saving
jobLogSchema.pre('save', function(next) {
  if (this.startTime && this.endTime && !this.duration) {
    this.duration = this.endTime.getTime() - this.startTime.getTime();
  }
  next();
});

// Create indexes
jobLogSchema.index({ jobType: 1, createdAt: -1 });
jobLogSchema.index({ status: 1, createdAt: -1 });
jobLogSchema.index({ 'meta.sourceId': 1 });
jobLogSchema.index({ 'meta.articleId': 1 });

export const JobLog = mongoose.model<IJobLog>('JobLog', jobLogSchema);