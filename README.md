# AI News Aggregator

A modern, AI-powered news aggregator with personalized feeds, intelligent insights, and mobile-first design. Built with React, Node.js, and OpenAI integration.

## 🌟 Features

### 📰 News Aggregation
- **Multiple Sources**: NewsAPI, Guardian, NYT, and custom sources
- **Categories**: Technology, Business, Science, Sports, Entertainment
- **Trending News**: Real-time popularity ranking
- **Advanced Search**: Filter by category, date, and relevance

### 🤖 AI-Powered Features
- **Smart Summaries**: AI-generated article summaries
- **Impact Analysis**: Sentiment and market impact analysis
- **AI Chatbot**: Interactive news assistant with context awareness
- **Trend Insights**: Pattern recognition and trend analysis

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for all screen sizes
- **PWA Support**: Install on iOS home screen
- **Touch-Friendly**: Mobile-optimized interactions
- **Offline Capability**: Basic offline functionality

### 🔧 Custom Sources
- **RSS Feeds**: Add any RSS feed
- **Websites**: Scrape custom news websites
- **Podcasts**: Podcast feed integration
- **Newsletters**: Newsletter source management

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- API keys for news services and OpenAI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-news-aggregator
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   NEWS_API_KEY=your_news_api_key
   GUARDIAN_API_KEY=your_guardian_api_key
   NYT_API_KEY=your_nytimes_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 📋 API Keys Setup

### NewsAPI
1. Visit [NewsAPI.org](https://newsapi.org/)
2. Sign up for a free account
3. Get your API key
4. Add to `.env`: `NEWS_API_KEY=your_key`

### Guardian API
1. Visit [Guardian Open Platform](https://open-platform.theguardian.com/)
2. Register for an API key
3. Add to `.env`: `GUARDIAN_API_KEY=your_key`

### NYT API
1. Visit [NYT Developer Network](https://developer.nytimes.com/)
2. Sign up and get an API key
3. Add to `.env`: `NYT_API_KEY=your_key`

### OpenAI
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get an API key
3. Add to `.env`: `OPENAI_API_KEY=your_key`

## 🏗️ Project Structure

```
ai-news-aggregator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   └── index.js            # Server entry point
├── package.json            # Root package.json
└── README.md              # This file
```

## 🎯 Usage

### Browsing News
1. **Home**: View latest news from all sources
2. **Categories**: Filter by news category
3. **Trending**: See most popular stories
4. **Search**: Find specific topics or keywords

### AI Features
1. **Summarize**: Click "Summarize" on any article
2. **Analyze**: Get AI analysis of article impact
3. **Chat**: Use the AI chatbot for news questions
4. **Quick Actions**: Use preset AI prompts

### Custom Sources
1. Go to "Custom Sources" page
2. Click "Add Source"
3. Choose source type (RSS, Website, Podcast, Newsletter)
4. Enter URL and details
5. Test and save

### Mobile Installation
1. Open the app on your mobile device
2. Tap the share button in your browser
3. Select "Add to Home Screen"
4. The app will now work like a native app

## 🔧 Development

### Available Scripts

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build for production
npm run build

# Start production server
npm start
```

### Adding New Features

1. **Backend Routes**: Add new routes in `server/routes/`
2. **Frontend Pages**: Create new pages in `client/src/pages/`
3. **Components**: Add reusable components in `client/src/components/`
4. **Types**: Update TypeScript types in `client/src/types/`

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the build folder
```

### Backend (Heroku/Railway)
```bash
# Set environment variables in your hosting platform
# Deploy the server folder
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- NewsAPI for news data
- OpenAI for AI capabilities
- React and Node.js communities
- All contributors and users

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for the news community**