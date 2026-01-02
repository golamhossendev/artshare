const PortfolioService = require('../services/portfolio.service');

class PortfolioController {
  static async get(req, res, next) {
    try {
      const { artistId } = req.params;
      const portfolio = await PortfolioService.getByArtistId(artistId);
      
      if (!portfolio) {
        // Create if doesn't exist
        const newPortfolio = await PortfolioService.getOrCreate(artistId);
        return res.json(newPortfolio);
      }
      
      res.json(portfolio);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const { artistId } = req.params;
      const updates = req.body;

      const portfolio = await PortfolioService.update(artistId, updates);
      res.json(portfolio);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PortfolioController;

