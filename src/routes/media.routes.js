const express = require('express');
const multer = require('multer');
const router = express.Router();
const MediaController = require('../controllers/media.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
  },
});

// POST /api/media/upload - Upload file directly to backend
router.post('/upload', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, MediaController.upload);

// POST /api/media/request-upload - Get SAS URL for upload (legacy, can be removed)
router.post('/request-upload', authenticate, MediaController.requestUpload);

// POST /api/media - Create media item after upload
router.post('/', authenticate, MediaController.create);

// GET /api/media - List media (feed or by artist)
router.get('/', MediaController.list);

// GET /api/media/:id - Get single media item
router.get('/:id', MediaController.getById);

// PUT /api/media/:id - Update media metadata
router.put('/:id', authenticate, MediaController.update);

// DELETE /api/media/:id - Delete media
router.delete('/:id', authenticate, MediaController.delete);

module.exports = router;

