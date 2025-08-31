import mongoose, { Document, Schema } from 'mongoose';

export interface ITicker extends Document {
  text: string;
  priority: number;
  expiry: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tickerSchema = new Schema<ITicker>({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  expiry: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Create indexes
tickerSchema.index({ expiry: 1 });
tickerSchema.index({ priority: -1, createdAt: -1 });

export const Ticker = mongoose.model<ITicker>('Ticker', tickerSchema);