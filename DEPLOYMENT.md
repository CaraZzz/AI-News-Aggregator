# News Aggregator - Deployment Guide

This guide covers deploying your AI-powered news aggregator to various platforms, making it publicly accessible while maintaining security and performance.

## 📋 Pre-Deployment Checklist

### Required API Keys
- [ ] **NewsAPI Key** - [Get from NewsAPI.org](https://newsapi.org/)
- [ ] **Guardian API Key** - [Get from Guardian Open Platform](https://open-platform.theguardian.com/)
- [ ] **NYT API Key** - [Get from NYT Developer](https://developer.nytimes.com/)
- [ ] **OpenAI API Key** - [Get from OpenAI Platform](https://platform.openai.com/)

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your actual API keys
NEWS_API_KEY=your_actual_newsapi_key
GUARDIAN_API_KEY=your_actual_guardian_key
NYT_API_KEY=your_actual_nyt_key
OPENAI_API_KEY=your_actual_openai_key
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Beginners)

**Frontend (React App)**
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build and Deploy Frontend**
   ```bash
   cd client
   npm run build
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `REACT_APP_API_URL=https://your-backend-url.com`

**Backend (Node.js API)**
1. **Prepare for Deployment**
   ```bash
   cd server
   # Create vercel.json in server directory
   ```

2. **Create `server/vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy Backend**
   ```bash
   vercel --prod
   ```

### Option 2: Railway (Full-Stack Deployment)

1. **Connect Repository**
   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository
   - Railway will detect both frontend and backend

2. **Configure Environment Variables**
   ```bash
   # Add in Railway dashboard for both services
   NEWS_API_KEY=your_key
   GUARDIAN_API_KEY=your_key
   NYT_API_KEY=your_key
   OPENAI_API_KEY=your_key
   CLIENT_URL=https://your-frontend-domain.railway.app
   ```

3. **Custom Start Commands**
   - **Backend**: `npm start`
   - **Frontend**: `npm run build && npm install -g serve && serve -s build -l $PORT`

### Option 3: Heroku

**Backend Deployment**
1. **Install Heroku CLI**
   ```bash
   # Follow instructions at: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Prepare Backend**
   ```bash
   cd server
   
   # Create Procfile
   echo "web: node index.js" > Procfile
   
   # Initialize git if not already done
   git init
   heroku create your-app-name-backend
   
   # Set environment variables
   heroku config:set NEWS_API_KEY=your_key
   heroku config:set GUARDIAN_API_KEY=your_key
   heroku config:set NYT_API_KEY=your_key
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set NODE_ENV=production
   
   # Deploy
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

**Frontend Deployment**
1. **Use Netlify/Vercel for frontend** (easier)
2. **Or deploy to Heroku with build pack**:
   ```bash
   cd client
   heroku create your-app-name-frontend
   heroku buildpacks:set https://github.com/mars/create-react-app-buildpack
   
   # Set API URL
   heroku config:set REACT_APP_API_URL=https://your-backend.herokuapp.com
   
   git add .
   git commit -m "Deploy frontend"
   git push heroku main
   ```

### Option 4: Digital Ocean App Platform

1. **Connect Repository**
   - Go to Digital Ocean → Apps → Create App
   - Connect your GitHub repository

2. **Configure Services**
   ```yaml
   # .do/app.yaml
   name: news-aggregator
   services:
   - name: backend
     source_dir: /server
     github:
       repo: your-username/your-repo
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: NEWS_API_KEY
       value: ${NEWS_API_KEY}
     - key: OPENAI_API_KEY
       value: ${OPENAI_API_KEY}
   
   - name: frontend
     source_dir: /client
     github:
       repo: your-username/your-repo
       branch: main
     build_command: npm run build
     run_command: npx serve -s build -l $PORT
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
   ```

## 🛡️ Security Configuration

### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
PORT=5000

# API Keys (keep these secret!)
NEWS_API_KEY=your_newsapi_key
GUARDIAN_API_KEY=your_guardian_key  
NYT_API_KEY=your_nyt_key
OPENAI_API_KEY=your_openai_key

# CORS Configuration
CLIENT_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET=your_secure_random_string_min_32_chars
BCRYPT_ROUNDS=12
```

### CORS Setup
Update `server/index.js` for production:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 📱 Mobile & PWA Configuration

### Service Worker Registration
Already configured in `client/src/index.tsx` and `client/public/sw.js`

### iOS Installation
1. **Icons**: Already created in `client/public/`
2. **Manifest**: Configured in `client/public/manifest.json`
3. **Meta tags**: Set in `client/public/index.html`

### Testing PWA
```bash
# Test locally
cd client
npm run build
npx serve -s build

# Open http://localhost:3000
# Use Chrome DevTools → Application → Service Workers
# Test "Add to Home Screen" functionality
```

## 🔧 Performance Optimization

### Frontend Optimizations
```bash
cd client

# Analyze bundle size
npm install -g webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### Backend Optimizations
```javascript
// Add to server/index.js
const compression = require('compression');
app.use(compression());

// Add caching headers
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  next();
});
```

## 🌐 Custom Domain Setup

### Frontend Domain
1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **Add CNAME record**:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: your-app.vercel.app (or your hosting domain)
   ```

### Backend Domain
1. **Add subdomain** for API:
   ```
   Type: CNAME
   Name: api
   Value: your-backend.railway.app
   ```

2. **Update environment variables**:
   ```bash
   REACT_APP_API_URL=https://api.yourdomain.com
   CLIENT_URL=https://yourdomain.com
   ```

## 📊 Monitoring & Analytics

### Basic Monitoring
```bash
# Add to server package.json
npm install --save express-rate-limit helmet morgan

# Already configured in server/index.js
```

### Error Tracking (Optional)
```bash
# Add Sentry for error tracking
npm install @sentry/node @sentry/browser
```

### Analytics (Optional)
```bash
# Add Google Analytics to client/public/index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## 🧪 Testing Deployment

### Pre-Deployment Tests
```bash
# Test backend API
curl https://your-backend-url.com/api/health

# Test frontend build
cd client && npm run build && npx serve -s build

# Test service worker
# Open DevTools → Application → Service Workers
```

### Post-Deployment Checklist
- [ ] News feeds loading correctly
- [ ] AI chat functionality working
- [ ] Custom sources can be added
- [ ] Mobile responsiveness verified
- [ ] PWA installation works on mobile
- [ ] All API endpoints responding
- [ ] Environment variables secure
- [ ] HTTPS enabled
- [ ] CORS configured properly

## 🔧 Troubleshooting

### Common Issues

**1. CORS Errors**
```javascript
// Update server CORS configuration
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

**2. API Rate Limits**
```bash
# Monitor API usage in logs
# Consider upgrading API plans if needed
```

**3. Build Failures**
```bash
# Clear cache and rebuild
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

**4. Service Worker Issues**
```javascript
// Clear service worker cache
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

## 📈 Scaling Considerations

### Database Migration
```bash
# When ready to scale, consider:
# - MongoDB Atlas for custom sources
# - Redis for caching
# - PostgreSQL for user management
```

### API Optimization
```javascript
// Add request caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Implement in news routes
```

### CDN Setup
```bash
# Use Cloudflare or AWS CloudFront
# Configure for static assets
# Enable gzip compression
```

## 🆘 Support

If you encounter issues during deployment:

1. **Check logs** on your hosting platform
2. **Verify environment variables** are set correctly
3. **Test API endpoints** individually
4. **Check CORS configuration** for cross-origin issues
5. **Monitor rate limits** on external APIs

## 🎉 Success!

Once deployed, your news aggregator will be:
- ✅ Publicly accessible via your domain
- ✅ Mobile-friendly with PWA capabilities
- ✅ Installable on iOS home screen
- ✅ Powered by AI for summaries and analysis
- ✅ Supporting custom news sources
- ✅ Optimized for performance and SEO

Share your deployed app URL and enjoy your personal AI news aggregator! 🚀