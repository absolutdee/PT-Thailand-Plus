// routes/search.routes.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// General search
router.get('/global', searchController.globalSearch);
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/autocomplete', searchController.getAutocomplete);

// Trainer search
router.get('/trainers', searchController.searchTrainers);
router.get('/trainers/advanced', searchController.advancedTrainerSearch);
router.get('/trainers/nearby', searchController.findNearbyTrainers);
router.get('/trainers/filter', searchController.filterTrainers);
router.get('/trainers/sort', searchController.sortTrainers);

// Package search
router.get('/packages', searchController.searchPackages);
router.get('/packages/filter', searchController.filterPackages);
router.get('/packages/by-category', searchController.searchPackagesByCategory);
router.get('/packages/by-price-range', searchController.searchPackagesByPriceRange);

// Gym and fitness center search
router.get('/gyms', searchController.searchGyms);
router.get('/gyms/nearby', searchController.findNearbyGyms);
router.get('/gyms/by-amenities', searchController.searchGymsByAmenities);
router.get('/gyms/map-search', searchController.mapSearchGyms);

// Event search
router.get('/events', searchController.searchEvents);
router.get('/events/upcoming', searchController.searchUpcomingEvents);
router.get('/events/by-date', searchController.searchEventsByDate);
router.get('/events/by-location', searchController.searchEventsByLocation);

// Content search
router.get('/articles', searchController.searchArticles);
router.get('/news', searchController.searchNews);
router.get('/content', searchController.searchAllContent);

// Recipe and nutrition search
router.get('/recipes', searchController.searchRecipes);
router.get('/foods', searchController.searchFoods);
router.get('/nutrition-plans', searchController.searchNutritionPlans);

// Workout search
router.get('/workouts', searchController.searchWorkouts);
router.get('/exercises', searchController.searchExercises);
router.get('/workout-plans', searchController.searchWorkoutPlans);

// User search (authenticated)
router.get('/users', auth, searchController.searchUsers);
router.get('/clients', auth, searchController.searchClients);

// Search filters and facets
router.get('/filters/trainers', searchController.getTrainerSearchFilters);
router.get('/filters/packages', searchController.getPackageSearchFilters);
router.get('/filters/gyms', searchController.getGymSearchFilters);
router.get('/filters/events', searchController.getEventSearchFilters);

// Search history and saved searches
router.get('/history', auth, searchController.getSearchHistory);
router.post('/history', auth, searchController.saveSearchHistory);
router.delete('/history/:id', auth, searchController.deleteSearchHistory);
router.delete('/history', auth, searchController.clearSearchHistory);

// Saved searches
router.get('/saved', auth, searchController.getSavedSearches);
router.post('/saved', auth, searchController.saveSearch);
router.delete('/saved/:id', auth, searchController.deleteSavedSearch);
router.put('/saved/:id', auth, searchController.updateSavedSearch);

// Search alerts
router.get('/alerts', auth, searchController.getSearchAlerts);
router.post('/alerts', auth, searchController.createSearchAlert);
router.put('/alerts/:id', auth, searchController.updateSearchAlert);
router.delete('/alerts/:id', auth, searchController.deleteSearchAlert);

// Popular and trending searches
router.get('/popular', searchController.getPopularSearches);
router.get('/trending', searchController.getTrendingSearches);
router.get('/recent', searchController.getRecentSearches);

// Search analytics (admin)
router.get('/admin/analytics', [auth, adminAuth], searchController.getSearchAnalytics);
router.get('/admin/popular-terms', [auth, adminAuth], searchController.getPopularSearchTerms);
router.get('/admin/no-results', [auth, adminAuth], searchController.getNoResultsQueries);
router.get('/admin/performance', [auth, adminAuth], searchController.getSearchPerformance);

// Search optimization
router.post('/admin/index-rebuild', [auth, adminAuth], searchController.rebuildSearchIndex);
router.get('/admin/index-status', [auth, adminAuth], searchController.getIndexStatus);

// Location-based search
router.get('/by-location', searchController.searchByLocation);
router.get('/radius-search', searchController.radiusSearch);

// Voice search
router.post('/voice', auth, searchController.voiceSearch);

// Image search
router.post('/image', auth, searchController.imageSearch);

// Search recommendations
router.get('/recommendations', auth, searchController.getSearchRecommendations);

module.exports = router;
