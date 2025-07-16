// routes/gym.routes.js
const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gym.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public gym routes
router.get('/public', gymController.getPublicGyms);
router.get('/public/:id', gymController.getPublicGymById);
router.get('/search', gymController.searchGyms);
router.get('/nearby', gymController.getNearbyGyms);
router.get('/featured', gymController.getFeaturedGyms);

// Map-based search
router.get('/map/search', gymController.mapSearch);
router.get('/map/bounds', gymController.getGymsInBounds);

// Gym details
router.get('/:id/details', gymController.getGymDetails);
router.get('/:id/facilities', gymController.getGymFacilities);
router.get('/:id/classes', gymController.getGymClasses);
router.get('/:id/trainers', gymController.getGymTrainers);
router.get('/:id/photos', gymController.getGymPhotos);
router.get('/:id/reviews', gymController.getGymReviews);

// Gym membership and check-in
router.post('/:id/check-in', auth, gymController.checkInToGym);
router.get('/my-check-ins', auth, gymController.getMyCheckIns);
router.get('/:id/check-in-history', auth, gymController.getCheckInHistory);

// Gym favorites
router.post('/:id/favorite', auth, gymController.addToFavorites);
router.delete('/:id/favorite', auth, gymController.removeFromFavorites);
router.get('/my-favorites', auth, gymController.getMyFavoriteGyms);

// Gym reviews and ratings
router.post('/:id/review', auth, gymController.addGymReview);
router.put('/review/:reviewId', auth, gymController.updateGymReview);
router.delete('/review/:reviewId', auth, gymController.deleteGymReview);

// Admin gym management
router.get('/admin/all', [auth, adminAuth], gymController.getAllGyms);
router.post('/admin/create', [auth, adminAuth], gymController.createGym);
router.put('/admin/:id', [auth, adminAuth], gymController.updateGym);
router.delete('/admin/:id', [auth, adminAuth], gymController.deleteGym);
router.get('/admin/:id', [auth, adminAuth], gymController.getGymById);

// Gym facilities management
router.get('/admin/:id/facilities', [auth, adminAuth], gymController.getGymFacilitiesAdmin);
router.post('/admin/:id/facilities', [auth, adminAuth], gymController.addGymFacility);
router.put('/admin/facilities/:facilityId', [auth, adminAuth], gymController.updateGymFacility);
router.delete('/admin/facilities/:facilityId', [auth, adminAuth], gymController.deleteGymFacility);

// Gym photos management
router.post('/admin/:id/photos', [auth, adminAuth], gymController.uploadGymPhotos);
router.delete('/admin/photos/:photoId', [auth, adminAuth], gymController.deleteGymPhoto);
router.put('/admin/photos/:photoId/feature', [auth, adminAuth], gymController.setFeaturedPhoto);

// Gym status management
router.put('/admin/:id/status', [auth, adminAuth], gymController.updateGymStatus);
router.put('/admin/:id/verify', [auth, adminAuth], gymController.verifyGym);
router.put('/admin/:id/feature', [auth, adminAuth], gymController.featureGym);

// Gym categories and types
router.get('/categories', gymController.getGymCategories);
router.post('/admin/categories', [auth, adminAuth], gymController.createGymCategory);
router.put('/admin/categories/:id', [auth, adminAuth], gymController.updateGymCategory);
router.delete('/admin/categories/:id', [auth, adminAuth], gymController.deleteGymCategory);

// Gym analytics
router.get('/admin/:id/analytics', [auth, adminAuth], gymController.getGymAnalytics);
router.get('/admin/analytics/overview', [auth, adminAuth], gymController.getGymsAnalyticsOverview);

// Gym partnerships
router.get('/admin/partnerships', [auth, adminAuth], gymController.getGymPartnerships);
router.post('/admin/:id/partnership', [auth, adminAuth], gymController.createGymPartnership);

module.exports = router;
