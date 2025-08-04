# NewsHub - AI-Powered News Aggregator

A modern, mobile-friendly news aggregator with AI-powered summaries, personalized content, and support for custom news sources including RSS feeds, podcasts, and newsletters.

## Features

- 📰 **Multiple News Sources**: Aggregates news from NewsAPI, The Guardian, and custom sources
- 🤖 **AI-Powered Summaries**: Automatic article summarization using OpenAI GPT
- 💬 **Integrated Chatbot**: Ask questions about news impact and analysis
- 📱 **Mobile-Friendly PWA**: Installable on iOS/Android home screens
- 🎨 **Apple-like Design**: Clean, minimalist UI with dark mode support
- 🔍 **Smart Categorization**: Auto-categorizes news into relevant topics
- 📊 **Popularity Tracking**: Sort by latest, popular, or trending articles
- 🎙️ **Podcast Support**: Add and manage podcast feeds
- 📧 **Newsletter Integration**: Support for newsletter sources
- ⚡ **Real-time Updates**: Automatic news fetching every 30 minutes
- 💾 **Offline Support**: Service worker caching for offline access

## Tech Stack

### Backend
- Node.js + Express
- MongoDB for data storage
- Redis for caching
- OpenAI API for AI features
- RSS Parser for feed parsing

### Frontend
- React + TypeScript
- Tailwind CSS for styling
- React Query for data fetching
- Framer Motion for animations
- PWA support with service workers

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 6+ (optional, for caching)
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd news-aggregator
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Start MongoDB and Redis (if using Docker):
```bash
docker-compose up -d mongo redis
```

5. Run the development server:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Configuration

### Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/news-aggregator

# OpenAI API for summaries and chatbot
OPENAI_API_KEY=your_openai_api_key_here

# News API Keys
NEWS_API_KEY=your_newsapi_org_key_here
GUARDIAN_API_KEY=your_guardian_api_key_here
NYT_API_KEY=your_nyt_api_key_here

# Redis for caching (optional)
REDIS_URL=redis://localhost:6379
```

### News Categories

The app supports the following news categories:
- Technology
- Business
- Entertainment
- Health
- Science
- Sports
- Politics
- World
- Lifestyle

## API Endpoints

### News Endpoints
- `GET /api/news` - Get news articles with filtering and pagination
- `GET /api/news/trending` - Get trending articles
- `GET /api/news/article/:id` - Get single article
- `GET /api/news/categories` - Get available categories
- `GET /api/news/sources` - Get news sources
- `POST /api/news/article/:id/share` - Track article share

### AI Endpoints
- `POST /api/ai/chat` - Chat with AI about news
- `POST /api/ai/analyze-impact` - Analyze news impact
- `POST /api/ai/summarize` - Generate article summary

### Custom Sources
- `GET /api/custom-sources` - Get custom sources
- `POST /api/custom-sources` - Add new source
- `PUT /api/custom-sources/:id` - Update source
- `DELETE /api/custom-sources/:id` - Delete source
- `POST /api/custom-sources/:id/test` - Test source

## Deployment

### Using Docker

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. The app will be available on port 80 (nginx proxy)

### Manual Deployment

1. Build the client:
```bash
cd client && npm run build
```

2. Set NODE_ENV to production:
```bash
export NODE_ENV=production
```

3. Start the server:
```bash
cd server && npm start
```

### Deployment Platforms

The app can be deployed to:
- **Heroku**: Use the included Dockerfile
- **AWS/GCP/Azure**: Use Docker or deploy directly
- **Vercel/Netlify**: Deploy frontend separately
- **DigitalOcean App Platform**: Use Docker deployment

## Features in Detail

### Custom News Sources

Add your favorite news sources:
1. Navigate to Sources page
2. Click "Add Source"
3. Choose type (RSS, Podcast, Newsletter, API)
4. Enter URL and details
5. The system will automatically fetch and categorize content

### AI Summaries

Articles are automatically summarized using GPT-3.5:
- Key points extraction
- Sentiment analysis
- 2-3 sentence summary

### PWA Installation

On mobile devices:
1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the share button
3. Select "Add to Home Screen"
4. The app will function like a native app

### Chatbot Usage

Click the chat icon to:
- Ask about news impact on specific topics
- Get analysis of current events
- Understand implications of news stories

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- News data from NewsAPI.org and The Guardian
- AI capabilities powered by OpenAI
- Icons from Lucide React
- UI inspiration from Apple's design system