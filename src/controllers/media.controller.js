const MediaService = require('../services/media.service');
const { trackEvent, trackException, trackMetric } = require('../config/appInsights');

class MediaController {
  static async requestUpload(req, res, next) {
    try {
      const userId = req.user.id;
      const { title, description, tags, type } = req.body;

      if (!type || !['image', 'video'].includes(type)) {
        return res.status(400).json({ error: 'Invalid media type. Must be "image" or "video"' });
      }

      const result = await MediaService.requestUpload(userId, {
        title,
        description,
        tags,
        type
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async upload(req, res, next) {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Determine media type from file mimetype
      const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
      
      const { title, description, tags } = req.body;
      
      const media = await MediaService.uploadAndCreate(userId, file, {
        title,
        description,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
        type: mediaType
      });

      const duration = Date.now() - startTime;
      
      trackEvent('MediaUpload', {
        mediaId: media.id,
        userId,
        title: media.title,
        type: media.type,
        fileSize: file.size,
        tagsCount: media.tags?.length || 0,
        duration,
        success: true,
      });
      
      trackMetric('MediaUploadDuration', duration, { type: mediaType });
      trackMetric('MediaUploadSize', file.size, { type: mediaType });

      res.status(201).json(media);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackEvent('MediaUpload', {
        userId: req.user.id,
        duration,
        success: false,
        error: error.message,
      });
      
      trackException(error, { action: 'upload', userId: req.user.id });
      
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const userId = req.user.id;
      const mediaData = req.body;

      const media = await MediaService.create(userId, mediaData);
      res.status(201).json(media);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { artistId } = req.query;

      if (!artistId) {
        return res.status(400).json({ error: 'artistId query parameter is required' });
      }

      const media = await MediaService.getById(id, artistId);
      res.json(media);
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    const startTime = Date.now();
    try {
      const { artistId, limit, offset } = req.query;

      let media;
      if (artistId) {
        media = await MediaService.getByArtistId(artistId, {
          limit: limit ? parseInt(limit) : 50
        });
      } else {
        media = await MediaService.getFeed({
          limit: limit ? parseInt(limit) : 50,
          offset: offset ? parseInt(offset) : 0
        });
      }

      const duration = Date.now() - startTime;
      
      trackEvent('MediaFetch', {
        artistId: artistId || 'all',
        count: media.length,
        limit: limit ? parseInt(limit) : 50,
        duration,
        success: true,
      });
      
      trackMetric('MediaFetchDuration', duration, {
        type: artistId ? 'profile' : 'feed',
      });

      res.json(media);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackEvent('MediaFetch', {
        artistId: req.query.artistId || 'all',
        duration,
        success: false,
        error: error.message,
      });
      
      trackException(error, { action: 'list', artistId: req.query.artistId });
      
      next(error);
    }
  }

  static async update(req, res, next) {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      await MediaService.update(id, userId, updates);
      
      // Get updated media with signed URLs
      const updatedMedia = await MediaService.getById(id, userId);
      
      const duration = Date.now() - startTime;
      
      trackEvent('MediaUpdate', {
        mediaId: id,
        userId,
        title: updatedMedia.title,
        updatedFields: Object.keys(updates),
        duration,
        success: true,
      });
      
      trackMetric('MediaUpdateDuration', duration);

      res.json(updatedMedia);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackEvent('MediaUpdate', {
        mediaId: req.params.id,
        userId: req.user.id,
        duration,
        success: false,
        error: error.message,
      });
      
      trackException(error, { action: 'update', mediaId: req.params.id, userId: req.user.id });
      
      next(error);
    }
  }

  static async delete(req, res, next) {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await MediaService.delete(id, userId);
      
      const duration = Date.now() - startTime;
      
      trackEvent('MediaDelete', {
        mediaId: id,
        userId,
        duration,
        success: true,
      });
      
      trackMetric('MediaDeleteDuration', duration);

      res.json({ message: 'Media deleted successfully' });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      trackEvent('MediaDelete', {
        mediaId: req.params.id,
        userId: req.user.id,
        duration,
        success: false,
        error: error.message,
      });
      
      trackException(error, { action: 'delete', mediaId: req.params.id, userId: req.user.id });
      
      next(error);
    }
  }
}

module.exports = MediaController;

