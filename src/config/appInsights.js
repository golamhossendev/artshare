const appInsights = require('applicationinsights');
const config = require('./env');

let client = null;

function initializeAppInsights() {
  if (!config.applicationInsights.connectionString) {
    console.warn('Application Insights connection string not provided');
    return null;
  }

  try {
    appInsights.setup(config.applicationInsights.connectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();

    client = appInsights.defaultClient;
    client.context.tags[client.context.keys.cloudRole] = 'artshare-backend';
    client.context.tags[client.context.keys.cloudRoleInstance] = process.env.NODE_ENV || 'development';

    console.log('Application Insights initialized');
    return client;
  } catch (error) {
    console.error('Failed to initialize Application Insights:', error);
    return null;
  }
}

function trackEvent(name, properties = {}) {
  if (!client) return;

  try {
    client.trackEvent({
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

function trackException(error, properties = {}) {
  if (!client) return;

  try {
    client.trackException({
      exception: error,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to track exception:', error);
  }
}

function trackMetric(name, value, properties = {}) {
  if (!client) return;

  try {
    client.trackMetric({
      name,
      value,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to track metric:', error);
  }
}

function trackDependency(name, commandName, duration, success, properties = {}) {
  if (!client) return;

  try {
    client.trackDependency({
      name,
      target: commandName,
      duration,
      success,
      resultCode: success ? 200 : 500,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to track dependency:', error);
  }
}

function getStatus() {
  const config = require('./env');
  const isConfigured = !!config.applicationInsights.connectionString;
  const isInitialized = !!client;
  
  let cloudRole = null;
  let cloudRoleInstance = null;
  
  if (isInitialized && client && client.context && client.context.tags && client.context.keys) {
    try {
      cloudRole = client.context.tags[client.context.keys.cloudRole] || null;
      cloudRoleInstance = client.context.tags[client.context.keys.cloudRoleInstance] || null;
    } catch (error) {
      // Ignore errors accessing context
    }
  }
  
  return {
    configured: isConfigured,
    initialized: isInitialized,
    connectionString: isConfigured ? '***configured***' : null,
    enabledFeatures: {
      autoDependencyCorrelation: isInitialized,
      autoCollectRequests: isInitialized,
      autoCollectPerformance: isInitialized,
      autoCollectExceptions: isInitialized,
      autoCollectDependencies: isInitialized,
      autoCollectConsole: isInitialized,
      useDiskRetryCaching: isInitialized,
      sendLiveMetrics: isInitialized,
    },
    cloudRole,
    cloudRoleInstance,
  };
}

module.exports = {
  initializeAppInsights,
  trackEvent,
  trackException,
  trackMetric,
  trackDependency,
  getClient: () => client,
  getStatus,
};

