const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const { initializeContainers } = require('./config/database');
const { initializeStorage } = require('./config/storage');
const { initializeAppInsights } = require('./config/appInsights');
const { errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const mediaRoutes = require('./routes/media.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const discoveryRoutes = require('./routes/discovery.routes');
const moderationRoutes = require('./routes/moderation.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging and telemetry
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { trackEvent, trackMetric } = require('./config/appInsights');
    
    trackEvent('APIRequest', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      success: res.statusCode < 400,
    });
    
    trackMetric('APIRequestDuration', duration, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    });
  });
  
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Application Insights status endpoint
app.get('/api/insights/status', (req, res) => {
  try {
    const { getStatus } = require('./config/appInsights');
    const status = getStatus();
    
    // Test tracking to verify it's working
    if (status.initialized) {
      const { trackEvent } = require('./config/appInsights');
      trackEvent('InsightsStatusCheck', {
        timestamp: new Date().toISOString(),
        endpoint: '/api/insights/status',
      });
    }
    
    res.json({
      status: 'ok',
      applicationInsights: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes (must be before static files)
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/users', userRoutes);

// Serve static files from frontend build
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all handler: send back React's index.html file for SPA routing
// Use a function to handle all non-API routes
app.use((req, res, next) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return next(); // Let error handler deal with 404
  }
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and storage
async function start() {
  try {
    // Initialize Application Insights first
    initializeAppInsights();
    
    await initializeContainers();
    initializeStorage();
    
    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = app;

