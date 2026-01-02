const ModerationFlag = require('../models/ModerationFlag');

class ModerationService {
  // Flag content
  static async flag(flagData) {
    const { mediaId, reporterId, reason } = flagData;
    
    // Check if already flagged by this user
    const existingFlags = await ModerationFlag.getByMediaId(mediaId);
    const alreadyFlagged = existingFlags.find(f => f.reporterId === reporterId && f.status === 'pending');
    
    if (alreadyFlagged) {
      throw new Error('You have already flagged this content');
    }

    return ModerationFlag.create({
      mediaId,
      reporterId,
      reason,
      status: 'pending'
    });
  }

  // Get pending flags
  static async getPendingFlags(limit = 50) {
    return ModerationFlag.getPending(limit);
  }

  // Get flags for a media item
  static async getFlagsByMediaId(mediaId) {
    return ModerationFlag.getByMediaId(mediaId);
  }

  // Update flag status
  static async updateFlagStatus(flagId, mediaId, status) {
    return ModerationFlag.updateStatus(flagId, mediaId, status);
  }
}

module.exports = ModerationService;

