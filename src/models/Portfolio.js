const { containers } = require('../config/database');

class Portfolio {
  constructor(data) {
    this.artistId = data.artistId;
    this.collectionIds = data.collectionIds || [];
    this.visibility = data.visibility || 'public';
    this.featuredItems = data.featuredItems || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Get portfolio container
  static getContainer() {
    return containers.portfolios;
  }

  // Get or create portfolio
  static async getOrCreate(artistId) {
    const container = this.getContainer();
    try {
      const { resource } = await container.item(artistId, artistId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        // Create new portfolio
        const portfolio = new Portfolio({ artistId });
        const { resource } = await container.items.create(portfolio);
        return resource;
      }
      throw error;
    }
  }

  // Get portfolio by artist ID
  static async getByArtistId(artistId) {
    const container = this.getContainer();
    try {
      const { resource } = await container.item(artistId, artistId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  // Update portfolio
  static async update(artistId, updates) {
    const container = this.getContainer();
    const portfolio = await this.getByArtistId(artistId);
    
    if (!portfolio) {
      // Create if doesn't exist
      const newPortfolio = new Portfolio({ artistId, ...updates });
      const { resource } = await container.items.create(newPortfolio);
      return resource;
    }
    
    const updated = {
      ...portfolio,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const { resource } = await container.item(artistId, artistId).replace(updated);
    return resource;
  }
}

module.exports = Portfolio;

