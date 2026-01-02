const { containers } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ModerationFlag {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.mediaId = data.mediaId;
    this.reporterId = data.reporterId;
    this.reason = data.reason;
    this.status = data.status || 'pending'; // "pending", "reviewed", "resolved"
    this.createdAt = data.createdAt || new Date().toISOString();
    this.reviewedAt = data.reviewedAt || null;
  }

  // Get moderation container
  static getContainer() {
    return containers.moderationFlags;
  }

  // Create flag
  static async create(flagData) {
    const flag = new ModerationFlag(flagData);
    const container = this.getContainer();
    const { resource } = await container.items.create(flag);
    return resource;
  }

  // Get flag by ID
  static async getById(id, mediaId) {
    const container = this.getContainer();
    try {
      const { resource } = await container.item(id, mediaId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  // Get flags by media ID
  static async getByMediaId(mediaId) {
    const container = this.getContainer();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.mediaId = @mediaId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@mediaId', value: mediaId }]
    };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  }

  // Get pending flags
  static async getPending(limit = 50) {
    const container = this.getContainer();
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.status = @status ORDER BY c.createdAt DESC OFFSET 0 LIMIT @limit',
      parameters: [
        { name: '@status', value: 'pending' },
        { name: '@limit', value: limit }
      ]
    };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  }

  // Update flag status
  static async updateStatus(id, mediaId, status) {
    const container = this.getContainer();
    const flag = await this.getById(id, mediaId);
    if (!flag) throw new Error('Flag not found');
    
    const updated = {
      ...flag,
      status,
      reviewedAt: new Date().toISOString()
    };
    
    const { resource } = await container.item(id, mediaId).replace(updated);
    return resource;
  }
}

module.exports = ModerationFlag;

