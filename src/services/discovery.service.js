const MediaItem = require('../models/MediaItem');
const User = require('../models/User');

class DiscoveryService {
  // Search by query (tags, artist name, handle)
  static async search(query) {
    if (!query || query.trim() === '') {
      return { media: [], users: [] };
    }

    const searchTerm = query.trim().toLowerCase();
    const results = {
      media: [],
      users: []
    };

    // Search media by tags
    const mediaByTags = await MediaItem.searchByTags([searchTerm]);
    results.media = mediaByTags;

    // Search users by name or handle
    const usersContainer = User.getContainer();
    const userQuerySpec = {
      query: 'SELECT * FROM c WHERE (CONTAINS(LOWER(c.name), @query) OR CONTAINS(LOWER(c.handle), @query))',
      parameters: [{ name: '@query', value: searchTerm }]
    };
    const { resources: users } = await usersContainer.items.query(userQuerySpec).fetchAll();
    
    // Remove password hash from users
    results.users = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return results;
  }

  // Get trending tags
  static async getTrendingTags(limit = 12) {
    const container = MediaItem.getContainer();
    
    // Get all published media and extract tags
    const querySpec = {
      query: 'SELECT c.tags FROM c WHERE c.status = @status AND c.visibility = @visibility',
      parameters: [
        { name: '@status', value: 'published' },
        { name: '@visibility', value: 'public' }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    
    // Count tag occurrences
    const tagCounts = {};
    resources.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // Sort by count and return top tags
    const trending = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);

    return trending;
  }

  // Get trending media
  static async getTrendingMedia(limit = 20) {
    // For now, return recent published media
    // In production, this would consider views, likes, etc.
    return MediaItem.getFeed({ limit });
  }
}

module.exports = DiscoveryService;

