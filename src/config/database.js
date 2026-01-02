const { CosmosClient } = require('@azure/cosmos');
const config = require('./env');

const client = new CosmosClient({
  endpoint: config.cosmos.endpoint,
  key: config.cosmos.key
});

const database = client.database(config.cosmos.database);

// Container references
const containers = {
  users: null,
  mediaItems: null,
  portfolios: null,
  moderationFlags: null
};

// Initialize containers
async function initializeContainers() {
  try {
    // Create database if it doesn't exist
    await database.read().catch(async () => {
      await client.databases.createIfNotExists({ id: config.cosmos.database });
    });

    // Create containers with partition keys
    const usersContainer = database.container('users');
    const mediaItemsContainer = database.container('mediaItems');
    const portfoliosContainer = database.container('portfolios');
    const moderationFlagsContainer = database.container('moderationFlags');

    // Create containers if they don't exist
    await usersContainer.read().catch(async () => {
      await database.containers.createIfNotExists({
        id: 'users',
        partitionKey: { paths: ['/id'] }
      });
    });

    await mediaItemsContainer.read().catch(async () => {
      await database.containers.createIfNotExists({
        id: 'mediaItems',
        partitionKey: { paths: ['/artistId'] }
      });
    });

    await portfoliosContainer.read().catch(async () => {
      await database.containers.createIfNotExists({
        id: 'portfolios',
        partitionKey: { paths: ['/artistId'] }
      });
    });

    await moderationFlagsContainer.read().catch(async () => {
      await database.containers.createIfNotExists({
        id: 'moderationFlags',
        partitionKey: { paths: ['/mediaId'] }
      });
    });

    // Store container references
    containers.users = usersContainer;
    containers.mediaItems = mediaItemsContainer;
    containers.portfolios = portfoliosContainer;
    containers.moderationFlags = moderationFlagsContainer;

    console.log('Cosmos DB containers initialized successfully');
  } catch (error) {
    console.error('Error initializing Cosmos DB containers:', error);
    throw error;
  }
}

module.exports = {
  client,
  database,
  containers,
  initializeContainers
};

