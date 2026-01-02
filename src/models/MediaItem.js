const { containers } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class MediaItem {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.artistId = data.artistId;
    this.title = data.title;
    this.description = data.description || '';
    this.blobUri = data.blobUri;
    this.blobName = data.blobName || null; // Store blob name for generating signed URLs
    this.thumb = data.thumb || data.blobUri; // Use blobUri as thumb if thumb not provided
    this.type = data.type; // "image" or "video"
    this.duration = data.duration || null;
    this.tags = data.tags || [];
    this.visibility = data.visibility || 'public';
    this.status = data.status || 'pending'; // "pending", "published", "deleted"
    this.author = data.author || {};
    this.uploadedAt = data.uploadedAt || new Date().toISOString();
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Get media container
  static getContainer() {
    return containers.mediaItems;
  }

  // Create media item
  static async create(mediaData) {
    const media = new MediaItem(mediaData);
    const container = this.getContainer();
    const { resource } = await container.items.create(media);
    return resource;
  }

  // Get media by ID
  static async getById(id, artistId) {
    const container = this.getContainer();
    try {
      const { resource } = await container.item(id, artistId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  // Get media by artist ID
  static async getByArtistId(artistId, options = {}) {
    const container = this.getContainer();
    const { status = 'published', visibility = 'public', limit = 50 } = options;
    
    let query = 'SELECT * FROM c WHERE c.artistId = @artistId';
    const parameters = [{ name: '@artistId', value: artistId }];

    if (status) {
      query += ' AND c.status = @status';
      parameters.push({ name: '@status', value: status });
    }

    if (visibility) {
      query += ' AND c.visibility = @visibility';
      parameters.push({ name: '@visibility', value: visibility });
    }

    query += ' ORDER BY c.uploadedAt DESC';

    const querySpec = { query, parameters };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.slice(0, limit);
  }

  // Get all published media (feed)
  static async getFeed(options = {}) {
    const container = this.getContainer();
    const { limit = 50 } = options;
    
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.status = @status AND c.visibility = @visibility ORDER BY c.uploadedAt DESC',
      parameters: [
        { name: '@status', value: 'published' },
        { name: '@visibility', value: 'public' }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources.slice(0, limit);
  }

  // Search media by tags
  static async searchByTags(tags) {
    const container = this.getContainer();
    const tagList = Array.isArray(tags) ? tags : [tags];
    
    // Cosmos DB doesn't support array contains directly in WHERE, so we use ARRAY_CONTAINS
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.status = @status AND c.visibility = @visibility AND ARRAY_CONTAINS(c.tags, @tag) ORDER BY c.uploadedAt DESC',
      parameters: [
        { name: '@status', value: 'published' },
        { name: '@visibility', value: 'public' },
        { name: '@tag', value: tagList[0] }
      ]
    };
    
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  }

  // Update media item
  static async update(id, artistId, updates) {
    const container = this.getContainer();
    const media = await this.getById(id, artistId);
    if (!media) throw new Error('Media item not found');
    
    const updated = {
      ...media,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const { resource } = await container.item(id, artistId).replace(updated);
    return resource;
  }

  // Soft delete media
  static async delete(id, artistId) {
    return this.update(id, artistId, { status: 'deleted' });
  }
}

module.exports = MediaItem;

