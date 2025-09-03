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
        categories: [categories[3]._id, categories[5]._id], // Tech, AI
        active: true,
      },
      {
        name: 'World News Network',
        url: 'https://worldnews.network',
        rssUrls: ['https://worldnews.network/feed'],
        lang: 'en',
        categories: [categories[1]._id, categories[0]._id], // World, Politics
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
    await User.insertMany([
      { email: 'admin@newshub.com', passwordHash: 'admin123', role: 'admin' },
      { email: 'editor@newshub.com', passwordHash: 'editor123', role: 'editor' },
    ]);
    console.log('Created users');

    // Create sample articles
    await Article.insertMany([
      {
        title: 'Revolutionary AI Technology Transforms Healthcare Industry',
        slug: 'revolutionary-ai-technology-transforms-healthcare-industry',
        summary: 'Breakthrough in AI promises to revolutionize medical diagnosis and treatment protocols worldwide.',
        content: 'Full content about AI in healthcare...',
        images: [{ 
          url: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'AI in Healthcare', 
          source: 'scraped' 
        }],
        category: categories[5]._id, // AI
        tags: ['AI', 'healthcare', 'technology'],
        author: 'Dr. Sarah Johnson',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date('2024-01-15T10:30:00Z'),
        hash: 'hash_ai_health',
      },
      {
        title: 'Global Climate Summit Reaches Historic Agreement',
        slug: 'global-climate-summit-reaches-historic-agreement',
        summary: 'World leaders unite on unprecedented climate action plan with binding commitments.',
        content: 'Full content about the climate summit...',
        images: [{ 
          url: 'https://images.pexels.com/photos/1133957/pexels-photo-1133957.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Lush green landscape', 
          source: 'scraped' 
        }],
        category: categories[1]._id, 
        tags: ['climate', 'environment', 'summit'],
        author: 'Michael Chen',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2024-01-14T14:20:00Z'),
        hash: 'hash_climate_summit',
      },
      {
        title: 'Championship Finals Break Viewership Records',
        slug: 'championship-finals-break-viewership-records',
        summary: 'Sports championship attracts unprecedented global audience with thrilling finale.',
        content: 'Full content about the championship finals...',
        
        images: [{ 
          url: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Full sports stadium', 
          source: 'scraped' 
        }],
        category: categories[2]._id, // Sports
        tags: ['championship', 'sports', 'viewership'],
        author: 'Emma Wilson',
        lang: 'en',
        sourceId: sources[2]._id,
        status: 'published',
        publishedAt: new Date('2024-01-13T18:45:00Z'),
        hash: 'hash_sports_finals',
      },
      {
        title: 'New Advances in Quantum Computing Announced',
        slug: 'new-advances-in-quantum-computing-announced',
        summary: 'Researchers have announced a significant leap forward in quantum computing, promising to solve complex problems faster than ever before.',
        content: 'Full content about quantum computing advances...',
        images: [{
          url: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Quantum Computing Chip', 
          source: 'scraped' 
        }],
        category: categories[3]._id, // Tech category
        tags: ['quantum computing', 'tech', 'science'],
        author: 'Jane Doe',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date(),
        hash: 'hash_quantum_computing_article', // Must be unique
      },
      {
        title: 'Next-Gen Graphene Battery Charges EVs in Under 5 Minutes',
        slug: 'next-gen-graphene-battery-charges-evs-in-5-minutes',
        summary: 'A breakthrough in battery technology could eliminate range anxiety and accelerate the adoption of electric vehicles.',
        content: 'Full content about graphene batteries...',
        images: [{ 
          url: 'https://images.pexels.com/photos/3184328/pexels-photo-3184328.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Scientists working in a lab', 
          source: 'scraped' 
        }],
        category: categories[3]._id, // Tech
        tags: ['ev', 'battery', 'tech', 'graphene'],
        author: 'Tom Maxwell',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date('2025-08-12T09:00:00Z'),
        hash: 'hash_graphene_battery',
      },
      {
        title: 'International Space Treaty Signed to Govern Lunar Exploration',
        slug: 'international-space-treaty-signed-for-lunar-exploration',
        summary: 'Over 30 nations have signed the new Artemis Accords, establishing a framework for peaceful and cooperative exploration of the Moon.',
        content: 'Full content about the new space treaty...',
        images: [{ 
          url: 'https://images.pexels.com/photos/586056/pexels-photo-586056.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'The moon seen from space', 
          source: 'scraped' 
        }],
        category: categories[1]._id, // World
        tags: ['space', 'moon', 'treaty', 'politics'],
        author: 'Isabelle Rossi',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-11T11:00:00Z'),
        hash: 'hash_lunar_treaty',
      },
      {
        title: 'Breakthrough Gene-Editing Trial Cures Genetic Disorder in Patients',
        slug: 'gene-editing-trial-cures-genetic-disorder',
        summary: 'In a world-first, a new CRISPR-based therapy has successfully cured a rare genetic disorder in all trial participants.',
        content: 'Full content about the CRISPR trial...',
        images: [{ 
          url: 'https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'DNA helix model', 
          source: 'scraped' 
        }],
        category: categories[4]._id, // Health
        tags: ['crispr', 'genetics', 'health', 'science'],
        author: 'David Lee',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date('2025-08-10T15:30:00Z'),
        hash: 'hash_crispr_cure',
      },
      {
        title: 'AI Art Generators Raise New Questions About Copyright Law',
        slug: 'ai-art-generators-and-copyright-law',
        summary: 'As AI-generated images flood the internet, artists and lawyers are grappling with who owns the copyright: the user, the AI, or no one?',
        content: 'Full content about AI and copyright...',
        images: [{ 
          url: 'https://images.pexels.com/photos/1587947/pexels-photo-1587947.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Abstract colorful art', 
          source: 'scraped' 
        }],
        category: categories[5]._id, // AI
        tags: ['ai', 'art', 'copyright', 'law'],
        author: 'Chloe Garcia',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date('2025-08-09T12:00:00Z'),
        hash: 'hash_ai_art_copyright',
      },
      {
        title: 'G7 Leaders Announce Sweeping Economic Sanctions',
        slug: 'g7-leaders-announce-economic-sanctions',
        summary: 'In an emergency session, leaders of the G7 nations have agreed on a coordinated package of economic sanctions targeting global financial instability.',
        content: 'Full content about G7 sanctions...',
        images: [{ 
          url: 'https://images.pexels.com/photos/7841533/pexels-photo-7841533.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'World leaders at a summit table', 
          source: 'scraped' 
        }],
        category: categories[0]._id, // Politics
        tags: ['g7', 'politics', 'economy', 'sanctions'],
        author: 'Alex Carter',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-08T19:00:00Z'),
        hash: 'hash_g7_sanctions',
      },
      {
        title: 'Underdog Team Completes Historic Comeback to Win World Cup',
        slug: 'underdog-team-wins-world-cup',
        summary: 'In what is being called the greatest final of all time, the national team overcame a two-goal deficit to win the World Cup in a dramatic penalty shootout.',
        content: 'Full content about the World Cup final...',
        images: [{ 
          url: 'https://images.pexels.com/photos/2444852/pexels-photo-2444852.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Soccer players celebrating with a trophy', 
          source: 'scraped' 
        }],
        category: categories[2]._id, // Sports
        tags: ['soccer', 'world cup', 'sports', 'final'],
        author: 'Maria Rodriguez',
        lang: 'en',
        sourceId: sources[2]._id,
        status: 'published',
        publishedAt: new Date('2025-08-07T22:00:00Z'),
        hash: 'hash_world_cup_final',
      },
      {
        title: 'Archaeologists Discover Lost City Hidden in Amazon Rainforest',
        slug: 'archaeologists-discover-lost-city-in-amazon',
        summary: 'Using advanced LiDAR technology, a team of international researchers has uncovered the ruins of a sprawling ancient civilization deep within the Amazon.',
        content: 'Full content about the lost city...',
        images: [{ 
          url: 'https://images.pexels.com/photos/33571/altar-stone-circle-pagan-mystic.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Ancient stone ruins in a jungle', 
          source: 'scraped' 
        }],
        category: categories[1]._id, // World
        tags: ['archaeology', 'discovery', 'amazon', 'science'],
        author: 'Dr. Ben Carter',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-06T13:45:00Z'),
        hash: 'hash_lost_amazon_city',
      },
      {
        title: 'Global "Cyber-Pandemic" Looms as Zero-Day Exploit Hits Major Software',
        slug: 'global-cyber-pandemic-zero-day-exploit',
        summary: 'A critical vulnerability in widely-used enterprise software has been discovered, with experts warning of a potential global cyber-attack.',
        content: 'Full content about the cybersecurity threat...',
        images: [{ 
          url: 'https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Hacker on a computer in a dark room', 
          source: 'scraped' 
        }],
        category: categories[6]._id, // Cybersecurity
        tags: ['cybersecurity', 'vulnerability', 'exploit', 'tech'],
        author: 'Kenji Tanaka',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date('2025-08-16T10:00:00Z'),
        hash: 'hash_cyber_pandemic',
      },
      {
        title: 'Iconic Director Announces Surprise Return for One Final Film',
        slug: 'iconic-director-announces-final-film',
        summary: 'After a decade in retirement, the legendary filmmaker has announced they will helm one last project, sending shockwaves through Hollywood.',
        content: 'Full content about the director\'s return...',
        images: [{ 
          url: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Vintage film camera', 
          source: 'scraped' 
        }],
        category: categories[7]._id, // Movies
        tags: ['movies', 'film', 'hollywood', 'director'],
        author: 'Sophie Dubois',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-17T14:30:00Z'),
        hash: 'hash_director_return',
      },
      {
        title: 'Stock Market Hits Record High Amidst Positive Inflation Report',
        slug: 'stock-market-hits-record-high',
        summary: 'Investor confidence surges as the latest economic report shows inflation cooling faster than expected, pushing major indices to all-time highs.',
        content: 'Full content about the stock market record...',
        images: [{ 
          url: 'https://images.pexels.com/photos/7876273/pexels-photo-7876273.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Stock market ticker board', 
          source: 'scraped' 
        }],
        category: categories[8]._id, // Stocks
        tags: ['stocks', 'finance', 'economy', 'inflation'],
        author: 'Frank Miller',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-18T18:00:00Z'),
        hash: 'hash_stock_market_high',
      },
      {
        title: 'New Wearable Tech Can Predict Flu Symptoms 3 Days in Advance',
        slug: 'wearable-tech-predicts-flu-symptoms',
        summary: 'A groundbreaking new sensor developed by health-tech startups can analyze biomarkers to predict the onset of influenza with 90% accuracy.',
        content: 'Full content about the health wearable...',
        images: [{ 
          url: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'A person wearing a smartwatch displaying health data', 
          source: 'scraped' 
        }],
        category: categories[4]._id, // Health
        tags: ['health', 'wearable', 'tech', 'flu'],
        author: 'Dr. Emily Carter',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date('2025-08-19T08:20:00Z'),
        hash: 'hash_health_wearable',
      },
      {
        title: 'eSports Officially Added to Olympic Games Starting 2028',
        slug: 'esports-added-to-olympic-games',
        summary: 'The International Olympic Committee has voted to include competitive video gaming as a medal event for the 2028 Los Angeles Olympic Games.',
        content: 'Full content about esports in the Olympics...',
        images: [{ 
          url: 'https://images.pexels.com/photos/7919662/pexels-photo-7919662.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'eSports arena with a large crowd', 
          source: 'scraped' 
        }],
        category: categories[2]._id, // Sports
        tags: ['esports', 'olympics', 'gaming', 'sports'],
        author: 'Anita Singh',
        lang: 'en',
        sourceId: sources[2]._id,
        status: 'published',
        publishedAt: new Date('2025-08-20T16:00:00Z'),
        hash: 'hash_esports_olympics',
      },
      {
        title: 'New Data Privacy Bill Passes with Overwhelming Majority',
        slug: 'new-data-privacy-bill-passes',
        summary: 'A comprehensive new bill focused on digital privacy and consumer data rights has passed through parliament and is expected to be signed into law.',
        content: 'Full content about the privacy bill...',
        images: [{ 
          url: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'A lock symbolizing data privacy', 
          source: 'scraped' 
        }],
        category: categories[0]._id, // Politics
        tags: ['privacy', 'law', 'politics', 'data'],
        author: 'John Smith',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-21T13:10:00Z'),
        hash: 'hash_privacy_bill',
      },
      {
        title: 'Massive Coral Reef Restoration Project Shows Promising Early Results',
        slug: 'coral-reef-restoration-shows-results',
        summary: 'Scientists are celebrating the successful growth of newly planted, heat-resistant corals in a major effort to save the world\'s largest reef system.',
        content: 'Full content about coral reef restoration...',
        images: [{ 
          url: 'https://images.pexels.com/photos/1658967/pexels-photo-1658967.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Colorful coral reef underwater', 
          source: 'scraped' 
        }],
        category: categories[1]._id, // World
        tags: ['environment', 'ocean', 'coral reef', 'science'],
        author: 'Dr. Maria Santos',
        lang: 'en',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-22T11:55:00Z'),
        hash: 'hash_coral_reef_restoration',
      },
      {
        title: 'बॉलीवुड के सुपरस्टार ने नई फिल्म की घोषणा की',
        slug: 'bollywood-superstar-announces-new-film-hindi',
        summary: 'प्रमुख अभिनेता ने अपने प्रशंसकों को आश्चर्यचकित करते हुए एक बड़े बजट की ऐतिहासिक ड्रामा फिल्म की घोषणा की है।',
        content: 'फिल्म के बारे में पूरी जानकारी यहाँ पढ़ें...',
        images: [{ 
          url: 'https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Film clapperboard', 
          source: 'scraped' 
        }],
        category: categories[9]._id, // Hindi
        tags: ['बॉलीवुड', 'फिल्म', 'मनोरंजन'],
        author: 'समाचार रिपोर्टर',
        lang: 'hi',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-23T10:00:00Z'),
        hash: 'hash_bollywood_film_announcement',
      },
      {
        title: 'టాలీవుడ్‌లో భారీ బడ్జెట్ చిత్రం ప్రారంభం',
        slug: 'tollywood-big-budget-film-launched-telugu',
        summary: 'ప్రముఖ దర్శకుడు మరియు అగ్ర నటుడి కలయికలో ఒక కొత్త సైన్స్ ఫిక్షన్ చిత్రం షూటింగ్ ప్రారంభమైంది.',
        content: 'ఈ సినిమా గురించి పూర్తి వివరాలు ఇక్కడ ఉన్నాయి...',
        images: [{ 
          url: 'https://images.pexels.com/photos/269140/pexels-photo-269140.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Movie camera on a set', 
          source: 'scraped' 
        }],
        category: categories[10]._id, // Telugu
        tags: ['టాలీవుడ్', 'సినిమా', 'వినోదం'],
        author: 'వార్తా ప్రతినిధి',
        lang: 'te',
        sourceId: sources[1]._id,
        status: 'published',
        publishedAt: new Date('2025-08-24T12:30:00Z'),
        hash: 'hash_tollywood_film_launch',
      },
      {
        title: 'The Race for 6G: What Comes After the Hyper-Connected World?',
        slug: 'the-race-for-6g-technology',
        summary: 'While 5G is still rolling out, global tech firms are already investing billions into 6G research, promising speeds 100 times faster.',
        content: 'Full content about 6G technology...',
        images: [{ 
          url: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 
          alt: 'Futuristic abstract technology background', 
          source: 'scraped' 
        }],
        category: categories[3]._id, // Tech
        tags: ['6g', 'telecom', 'tech', 'future'],
        author: 'Alex Johnson',
        lang: 'en',
        sourceId: sources[0]._id,
        status: 'published',
        publishedAt: new Date('2025-08-25T09:15:00Z'),
        hash: 'hash_6g_race',
      }
    ]);
  console.log('Created sample articles');
  console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

seed();