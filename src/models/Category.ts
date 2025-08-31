import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  key: string;
  label: string;
  icon: string;
  color: string;
  parent?: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  key: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    default: 'newspaper'
  },
  color: {
    type: String,
    required: true,
    default: '#6366f1'
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes

categorySchema.index({ parent: 1 });
categorySchema.index({ order: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);