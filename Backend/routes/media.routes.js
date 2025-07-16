// routes/media.routes.js
const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// File upload routes
router.post('/upload/image', [auth, upload.single('image')], mediaController.uploadImage);
router.post('/upload/video', [auth, upload.single('video')], mediaController.uploadVideo);
router.post('/upload/document', [auth, upload.single('document')], mediaController.uploadDocument);
router.post('/upload/multiple', [auth, upload.array('files', 10)], mediaController.uploadMultipleFiles);

// User media management
router.get('/my-files', auth, mediaController.getMyFiles);
router.delete('/my-files/:id', auth, mediaController.deleteMyFile);
router.get('/my-files/:id', auth, mediaController.getMyFileById);
router.put('/my-files/:id', auth, mediaController.updateMyFile);

// Profile media
router.post('/profile/avatar', [auth, upload.single('avatar')], mediaController.uploadAvatar);
router.post('/profile/cover', [auth, upload.single('cover')], mediaController.uploadCoverPhoto);
router.delete('/profile/avatar', auth, mediaController.deleteAvatar);
router.delete('/profile/cover', auth, mediaController.deleteCoverPhoto);

// Trainer portfolio
router.get('/trainer/portfolio', auth, mediaController.getTrainerPortfolio);
router.post('/trainer/portfolio', [auth, upload.single('image')], mediaController.addToPortfolio);
router.delete('/trainer/portfolio/:id', auth, mediaController.removeFromPortfolio);
router.put('/trainer/portfolio/:id/feature', auth, mediaController.setFeaturedImage);

// Workout media
router.post('/workout/progress-photo', [auth, upload.single('photo')], mediaController.uploadProgressPhoto);
router.post('/workout/exercise-video', [auth, upload.single('video')], mediaController.uploadExerciseVideo);
router.get('/workout/media/:workoutId', auth, mediaController.getWorkoutMedia);

// Gym media
router.post('/gym/:gymId/photos', [auth, upload.array('photos', 20)], mediaController.uploadGymPhotos);
router.get('/gym/:gymId/photos', mediaController.getGymPhotos);
router.delete('/gym/photo/:photoId', [auth, adminAuth], mediaController.deleteGymPhoto);

// Event media
router.post('/event/:eventId/photos', [auth, upload.array('photos', 10)], mediaController.uploadEventPhotos);
router.get('/event/:eventId/photos', mediaController.getEventPhotos);

// Admin media management
router.get('/admin/all', [auth, adminAuth], mediaController.getAllMedia);
router.delete('/admin/:id', [auth, adminAuth], mediaController.deleteMediaFile);
router.get('/admin/statistics', [auth, adminAuth], mediaController.getMediaStatistics);
router.get('/admin/storage-usage', [auth, adminAuth], mediaController.getStorageUsage);

// Media processing
router.post('/process/resize', auth, mediaController.resizeImage);
router.post('/process/compress', auth, mediaController.compressMedia);
router.post('/process/convert', auth, mediaController.convertMedia);

// Media optimization
router.post('/optimize/image', auth, mediaController.optimizeImage);
router.post('/optimize/video', auth, mediaController.optimizeVideo);

// Bulk operations
router.post('/bulk/upload', [auth, upload.array('files', 50)], mediaController.bulkUpload);
router.post('/bulk/delete', auth, mediaController.bulkDelete);
router.post('/bulk/organize', auth, mediaController.bulkOrganize);

// Media folders/albums
router.get('/folders', auth, mediaController.getMediaFolders);
router.post('/folders', auth, mediaController.createMediaFolder);
router.put('/folders/:id', auth, mediaController.updateMediaFolder);
router.delete('/folders/:id', auth, mediaController.deleteMediaFolder);
router.post('/folders/:folderId/files', auth, mediaController.addFilesToFolder);

// Media sharing
router.post('/:id/share', auth, mediaController.shareMedia);
router.get('/shared/:shareToken', mediaController.getSharedMedia);
router.delete('/:id/share', auth, mediaController.removeShare);

// Media metadata
router.put('/:id/metadata', auth, mediaController.updateMediaMetadata);
router.get('/:id/metadata', auth, mediaController.getMediaMetadata);

// Media backup and restore
router.post('/backup', [auth, adminAuth], mediaController.backupMedia);
router.post('/restore', [auth, adminAuth], mediaController.restoreMedia);

// CDN and delivery
router.get('/cdn-urls', auth, mediaController.getCdnUrls);
router.post('/generate-thumbnails', auth, mediaController.generateThumbnails);

module.exports = router;
