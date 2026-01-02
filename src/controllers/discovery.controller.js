const DiscoveryService = require('../services/discovery.service');

class DiscoveryController {
  static async search(req, res, next) {
    try {
      const { q } = req.query;
      const results = await DiscoveryService.search(q || '');
      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  static async getTrending(req, res, next) {
    try {
      const tags = await DiscoveryService.getTrendingTags();
      const media = await DiscoveryService.getTrendingMedia();
      res.json({ tags, media });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DiscoveryController;

