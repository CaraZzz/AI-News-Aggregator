const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const connectDB = require('./utils/database');
const cacheManager = require('./utils/cache');
const newsFetcher = require('./utils/newsFetcher');

const newsRoutes = require('./routes/news');
const aiRoutes = require('./routes/ai');
const customSourcesRoutes = require('./routes/customSources');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Connect to Redis cache
cacheManager.connect();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure properly for production
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// CORS - only in development
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/custom-sources', customSourcesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      cache: cacheManager.isConnected ? 'connected' : 'disconnected'
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - only for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Schedule news fetching every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running scheduled news fetch...');
  try {
    await newsFetcher.fetchAllSources();
    console.log('Scheduled news fetch completed');
  } catch (error) {
    console.error('Error in scheduled news fetch:', error);
  }
});

// Initial news fetch on startup
setTimeout(async () => {
  console.log('Running initial news fetch...');
  try {
    await newsFetcher.fetchAllSources();
    console.log('Initial news fetch completed');
  } catch (error) {
    console.error('Error in initial news fetch:', error);
  }
}, 5000); // Wait 5 seconds for services to initialize

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});