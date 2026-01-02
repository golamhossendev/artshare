const Portfolio = require('../models/Portfolio');

class PortfolioService {
  // Get or create portfolio
  static async getOrCreate(artistId) {
    return Portfolio.getOrCreate(artistId);
  }

  // Get portfolio by artist ID
  static async getByArtistId(artistId) {
    return Portfolio.getByArtistId(artistId);
  }

  // Update portfolio
  static async update(artistId, updates) {
    const allowedUpdates = ['collectionIds', 'visibility', 'featuredItems'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    return Portfolio.update(artistId, filteredUpdates);
  }
}

module.exports = PortfolioService;

