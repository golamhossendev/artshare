const path = require('path');
// Load .env from backend directory, regardless of where the script is run from
require('dotenv').config( );

const requiredEnvVars = [
  'COSMOS_DB_ENDPOINT',
  'COSMOS_DB_KEY',
  'COSMOS_DB_NAME',
  'AZURE_BLOB_CONNECTION_STRING',
  'BLOB_CONTAINER_NAME',
  'JWT_SECRET',
  'PORT'
];

// Validate required environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set in environment variables`);
  }
});

module.exports = {
  cosmos: {
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
    database: process.env.COSMOS_DB_NAME || 'CloudPixDB',
    connectionString: process.env.AZURE_COSMOS_CONNECTION_STRING
  },
  storage: {
    connectionString: process.env.AZURE_BLOB_CONNECTION_STRING,
    container: process.env.BLOB_CONTAINER_NAME || 'cloudpix-files'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY || '24h'
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  applicationInsights: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    apiKey: process.env.APPLICATION_INSIGHT_API_KEY
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};

