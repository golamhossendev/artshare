const { v4: uuidv4 } = require('uuid');
const MediaItem = require('../models/MediaItem');
const User = require('../models/User');
const { generateSASUrl, generateReadSASUrl, getBlobUrl, uploadFile } = require('../config/storage');

class MediaService {
  // Request upload - create metadata stub and return SAS URL
  static async requestUpload(userId, mediaData) {
    const { title, description, tags, type } = mediaData;
    
    // Generate unique blob name
    const blobName = `${userId}/${uuidv4()}-${Date.now()}`;
    
    // Generate SAS URL for upload
    const { sasUrl, blobUrl } = generateSASUrl(blobName, 'w');
    
    // Create temporary media item with pending status
    const mediaId = uuidv4();
    const media = await MediaItem.create({
      id: mediaId,
      artistId: userId,
      title: title || 'Untitled',
      description: description || '',
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean),
      type,
      blobUri: blobUrl,
      thumb: blobUrl, // Will be updated after processing
      status: 'pending',
      visibility: 'public'
    });

    return {
      sasUrl,
      mediaId: media.id,
      blobName,
      blobUrl
    };
  }

  // Upload file and create media item
  static async uploadAndCreate(userId, file, mediaData) {
    const user = await User.getById(userId);
    if (!user) throw new Error('User not found');

    const { title, description, tags, type } = mediaData;
    
    // Generate unique blob name
    const blobName = `${userId}/${uuidv4()}-${Date.now()}-${file.originalname}`;
    
    // Upload file to blob storage
    const blobUrl = await uploadFile(blobName, file.buffer, file.mimetype);
    
    // Generate signed URLs for immediate access
    const signedBlobUrl = generateReadSASUrl(blobName);
    
    // Create media item
    const mediaId = uuidv4();
    const media = await MediaItem.create({
      id: mediaId,
      artistId: userId,
      title: title || file.originalname,
      description: description || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      type,
      blobUri: blobUrl, // Store base URL, we'll generate signed URLs when retrieving
      blobName: blobName, // Store blob name for generating signed URLs
      thumb: blobUrl,
      status: 'published',
      visibility: 'public',
      author: {
        id: user.id,
        name: user.name,
        handle: user.handle
      }
    });

    // Return media with signed URLs
    media.blobUri = signedBlobUrl;
    media.thumb = signedBlobUrl;
    
    return media;
  }

  // Create media item after upload (updates the pending item created in requestUpload)
  static async create(userId, mediaData) {
    const user = await User.getById(userId);
    if (!user) throw new Error('User not found');

    // If mediaId is provided, update existing pending item
    if (mediaData.id) {
      const existing = await MediaItem.getById(mediaData.id, userId);
      if (existing && existing.status === 'pending') {
        // Update the pending item to published
        const updated = await MediaItem.update(mediaData.id, userId, {
          ...mediaData,
          author: {
            id: user.id,
            name: user.name,
            handle: user.handle
          },
          status: 'published' // Auto-publish for now, can be changed to require moderation
        });
        return updated;
      }
    }

    // Otherwise create new item
    const media = await MediaItem.create({
      ...mediaData,
      artistId: userId,
      author: {
        id: user.id,
        name: user.name,
        handle: user.handle
      },
      status: 'published'
    });

    return media;
  }

  // Get media by ID
  static async getById(id, artistId) {
    const media = await MediaItem.getById(id, artistId);
    if (!media) throw new Error('Media item not found');
    
    // Generate signed URLs for blob access
    let blobName = media.blobName;
    
    // If blobName not stored, extract from blobUri
    if (!blobName && media.blobUri) {
      blobName = this.extractBlobName(media.blobUri);
    }
    
    if (blobName) {
      try {
        const signedUrl = generateReadSASUrl(blobName);
        media.blobUri = signedUrl;
        if (media.thumb) {
          media.thumb = signedUrl;
        }
      } catch (error) {
        console.error('Error generating signed URL for media:', id, error);
      }
    }
    
    return media;
  }

  // Get media feed
  static async getFeed(options = {}) {
    const mediaList = await MediaItem.getFeed(options);
    return this.addSignedUrls(mediaList);
  }

  // Get media by artist
  static async getByArtistId(artistId, options = {}) {
    const mediaList = await MediaItem.getByArtistId(artistId, options);
    return this.addSignedUrls(mediaList);
  }

  // Extract blob name from blob URI
  static extractBlobName(blobUri) {
    if (!blobUri) return null;
    
    try {
      // Remove query parameters if any
      const urlWithoutQuery = blobUri.split('?')[0];
      const urlParts = urlWithoutQuery.split('/');
      
      // Find container name in URL
      const containerIndex = urlParts.findIndex(part => part === config.storage.container);
      if (containerIndex !== -1 && containerIndex < urlParts.length - 1) {
        // Get everything after container name
        return urlParts.slice(containerIndex + 1).join('/');
      }
      
      // Alternative: if URL format is different, try to extract from end
      // Format: https://account.blob.core.windows.net/container/blobName
      const blobIndex = urlParts.findIndex(part => part.includes('.blob.core.windows.net'));
      if (blobIndex !== -1) {
        // Container should be right after .blob.core.windows.net
        const containerName = urlParts[blobIndex + 1];
        if (containerName === config.storage.container && blobIndex + 2 < urlParts.length) {
          return urlParts.slice(blobIndex + 2).join('/');
        }
      }
    } catch (error) {
      console.error('Error extracting blob name from URL:', blobUri, error);
    }
    
    return null;
  }

  // Add signed URLs to media items
  static addSignedUrls(mediaList) {
    return mediaList.map(media => {
      let blobName = media.blobName;
      
      // If blobName not stored, extract from blobUri
      if (!blobName && media.blobUri) {
        blobName = this.extractBlobName(media.blobUri);
      }
      
      if (blobName) {
        try {
          const signedUrl = generateReadSASUrl(blobName);
          media.blobUri = signedUrl;
          if (media.thumb) {
            media.thumb = signedUrl;
          }
        } catch (error) {
          console.error('Error generating signed URL for media:', media.id, error);
        }
      }
      
      return media;
    });
  }

  // Update media metadata
  static async update(id, artistId, updates) {
    // Only allow updating certain fields
    const allowedUpdates = ['title', 'description', 'tags', 'visibility'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    return MediaItem.update(id, artistId, filteredUpdates);
  }

  // Delete media (soft delete)
  static async delete(id, artistId) {
    return MediaItem.delete(id, artistId);
  }

  // Search media
  static async search(query, options = {}) {
    if (!query) {
      return this.getFeed(options);
    }

    // Search by tags
    const tags = query.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      const mediaList = await MediaItem.searchByTags(tags);
      return this.addSignedUrls(mediaList);
    }

    // If no tags, return feed
    return this.getFeed(options);
  }
}

module.exports = MediaService;

