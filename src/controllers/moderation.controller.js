const ModerationService = require('../services/moderation.service');

class ModerationController {
  static async flag(req, res, next) {
    try {
      const userId = req.user.id;
      const { mediaId, reason } = req.body;

      if (!mediaId || !reason) {
        return res.status(400).json({ error: 'mediaId and reason are required' });
      }

      const flag = await ModerationService.flag({
        mediaId,
        reporterId: userId,
        reason
      });

      res.status(201).json(flag);
    } catch (error) {
      next(error);
    }
  }

  static async getPending(req, res, next) {
    try {
      const { limit } = req.query;
      const flags = await ModerationService.getPendingFlags(limit ? parseInt(limit) : 50);
      res.json(flags);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ModerationController;

