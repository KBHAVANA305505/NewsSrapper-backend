import mongoose from 'mongoose';
import { User, Category, Source, Article, Ticker } from '../src/models';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/newshub');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Source.deleteMany({});
    await Article.deleteMany({});
    await Ticker.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const categories = await Category.insertMany([
      { key: 'politics', label: 'Politics', icon: 'landmark', color: '#dc2626', order: 1 },
      { key: 'world', label: 'World', icon: 'globe', color: '#2563eb', order: 2 },
      { key: 'sports', label: 'Sports', icon: 'trophy', color: '#16a34a', order: 3 },
      { key: 'tech', label: 'Technology', icon: 'cpu', color: '#7c3aed', order: 4 },
      { key: 'health', label: 'Health', icon: 'heart', color: '#dc2626', order: 5 },
      { key: 'ai', label: 'Artificial Intelligence', icon: 'brain', color: '#8b5cf6', order: 6 },
      { key: 'cyber', label: 'Cybersecurity', icon: 'shield', color: '#059669', order: 7 },
      { key: 'movies', label: 'Movies', icon: 'film', color: '#ea580c', order: 8 },
      { key: 'stocks', label: 'Stocks', icon: 'trending-up', color: '#16a34a', order: 9 },
      { key: 'hindi', label: 'Hindi', icon: 'volume-2', color: '#dc2626', order: 10 },
      { key: 'telugu', label: 'Telugu', icon: 'volume-2', color: '#dc2626', order: 11 },
    ]);
    console.log('Created categories');

    // Create sources
    const sources = await Source.insertMany([
      {
        name: 'Tech News Daily',
        url: 'https://technewsdaily.com',
        rssUrls: ['https://technewsdaily.com/feed'],
        lang: 'en',
        categories: [categories[3]._id], // Tech
        active: true,
      },
      {
        name: 'World News Network',
        url: 'https://worldnews.network',
        rssUrls: ['https://worldnews.network/feed'],
        lang: 'en',
        categories: [categories[1]._id], // World
        active: true,
      },
      {
        name: 'Sports Central',
        url: 'https://sportscentral.com',
        rssUrls: ['https://sportscentral.com/feed'],
        lang: 'en',
        categories: [categories[2]._id], // Sports
        active: true,
      },
    ]);
    console.log('Created sources');

    // Create users
    const users = await User.insertMany([
      {
        email: 'admin@newshub.com',
        passwordHash: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
      },
      {
        email: 'editor@newshub.com',
        passwordHash: 'editor123', // Will be hashed by pre-save hook
        role: 'editor',
      },
      {
        email: 'reader@newshub.com',
        passwordHash: 'reader123', // Will be hashed by pre-save hook
        role: 'reader',
      },
    ]);
    console.log('Created users');

    // Create sample articles
    const articles = await Article.insertMany([
      {
        title: 'Revolutionary AI Technology Transforms Healthcare Industry',
        slug: 'revolutionary-ai-technology-transforms-healthcare-industry',
        summary: 'Breakthrough in artificial intelligence promises to revolutionize medical diagnosis and treatment protocols worldwide.',
        content: 'In a groundbreaking development that promises to reshape the healthcare landscape, researchers at leading medical institutions have unveiled a revolutionary artificial intelligence system capable of diagnosing diseases with unprecedented accuracy. The AI system, developed through a collaboration between tech giants and medical research centers, has demonstrated remarkable success in early trials, showing diagnostic accuracy rates that surpass human medical professionals in several key areas.',
        images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'],
        category: categories[5]._id, // AI
        tags: ['AI', 'healthcare', 'technology', 'medical'],
        author: 'Dr. Sarah Johnson',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        aiInfo: {
          rewritten: true,
          plagiarismScore: 5.2,
        },
        seo: {
          metaDescription: 'Revolutionary AI technology transforms healthcare with unprecedented diagnostic accuracy rates.',
          keywords: ['AI', 'healthcare', 'technology', 'medical diagnosis'],
        },
        publishedAt: new Date('2024-01-15T10:30:00Z'),
        hash: 'abc123def456',
      },
      {
        title: 'Global Climate Summit Reaches Historic Agreement',
        slug: 'global-climate-summit-reaches-historic-agreement',
        summary: 'World leaders unite on unprecedented climate action plan with binding commitments for carbon neutrality.',
        content: 'World leaders gathered at the Global Climate Summit have reached a historic agreement on climate action, marking a turning point in the fight against climate change. The agreement includes binding commitments from participating nations to achieve carbon neutrality by 2050, with interim targets for 2030.',
        images: ['https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=400&fit=crop'],
        category: categories[1]._id, // World
        tags: ['climate', 'environment', 'summit', 'agreement'],
        author: 'Michael Chen',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        aiInfo: {
          rewritten: true,
          plagiarismScore: 3.8,
        },
        seo: {
          metaDescription: 'Global Climate Summit achieves historic climate agreement with binding carbon neutrality commitments.',
          keywords: ['climate', 'environment', 'summit', 'carbon neutrality'],
        },
        publishedAt: new Date('2024-01-14T14:20:00Z'),
        hash: 'def456ghi789',
      },
      {
        title: 'Championship Finals Break Viewership Records',
        slug: 'championship-finals-break-viewership-records',
        summary: 'Sports championship attracts unprecedented global audience with thrilling finale.',
        content: 'The championship finals have broken all previous viewership records, attracting an unprecedented global audience of over 2 billion viewers. The thrilling finale kept audiences on the edge of their seats until the final moments, making it one of the most-watched sporting events in history.',
        images: ['https://images.unsplash.com/photo-1540747933386-5627b101f40c?w=800&h=400&fit=crop'],
        category: categories[2]._id, // Sports
        tags: ['championship', 'sports', 'viewership', 'finale'],
        author: 'Emma Wilson',
        lang: 'en',
        sourceId: sources[2]._id,
        status: 'published',
        aiInfo: {
          rewritten: true,
          plagiarismScore: 2.1,
        },
        seo: {
          metaDescription: 'Championship finals break viewership records with unprecedented global audience.',
          keywords: ['championship', 'sports', 'viewership', 'records'],
        },
        publishedAt: new Date('2024-01-13T18:45:00Z'),
        hash: 'ghi789jkl012',
      },
    ]);
    console.log('Created sample articles');

    // Create sample tickers
    const tickers = await Ticker.insertMany([
      {
        text: 'Breaking: Major earthquake strikes Pacific region • Emergency services deployed',
        priority: 1,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
      {
        text: 'Tech giant announces revolutionary AI breakthrough • Stock markets surge',
        priority: 2,
        expiry: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      },
      {
        text: 'Global climate summit reaches historic agreement • World leaders unite',
        priority: 3,
        expiry: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      },
    ]);
    console.log('Created sample tickers');

    console.log('Database seeded successfully!');
    console.log('Default users:');
    console.log('Admin: admin@newshub.com / admin123');
    console.log('Editor: editor@newshub.com / editor123');
    console.log('Reader: reader@newshub.com / reader123');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seed();