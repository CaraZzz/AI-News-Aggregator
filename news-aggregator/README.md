# NewsHub - AI-Powered News Aggregator

A modern, mobile-friendly news aggregator web app with AI-powered summaries, customizable news sources, and an integrated chatbot for news analysis.

## Features

✨ **Multi-Source News Aggregation**
- Aggregates news from various sources
- Sort by latest or popularity
- Category-based filtering (Technology, Business, Health, Sports, etc.)

🤖 **AI-Powered Features**
- AI-generated summaries for each article
- Integrated chatbot for news impact analysis
- Ask questions about news trends and implications

📱 **Mobile-First & PWA**
- Fully responsive design
- Progressive Web App (PWA) support
- Add to iOS/Android home screen
- Offline capabilities

🔧 **Customizable Sources**
- Add custom news sources (RSS, APIs, Podcasts, Newsletters)
- Manage and toggle sources
- Support for API keys

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/news-aggregator.git
cd news-aggregator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Configuration

### API Keys

To use real news data, add your API keys:

1. Create a `.env` file in the root directory
2. Add your News API key:
```
REACT_APP_NEWS_API_KEY=your_news_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### Custom News Sources

You can add custom news sources through the UI:
1. Click "Sources" in the navigation
2. Click "Add Source"
3. Choose the source type (RSS, API, Podcast, Newsletter)
4. Enter the URL and optional API key

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Lucide Icons
- **State Management**: React Hooks
- **API Integration**: Axios
- **Date Handling**: date-fns
- **PWA**: Service Workers

## Features in Detail

### News Categories
- All News
- Technology
- Business
- Health
- Sports
- Entertainment
- Environment

### Sorting Options
- **Latest**: Shows most recent articles first
- **Popular**: Shows articles by popularity score

### AI Summary
Each article can display an AI-generated summary that provides key points and insights.

### Chatbot Assistant
Ask questions like:
- "What's the impact of this news on the tech industry?"
- "How might this affect stock markets?"
- "Summarize today's top stories"

## Mobile Features

### PWA Capabilities
- Install as a native app
- Offline browsing
- Push notifications (coming soon)
- Background sync

### iOS Home Screen
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- News data from various public APIs
- Icons from Lucide React
- UI components from Headless UI
