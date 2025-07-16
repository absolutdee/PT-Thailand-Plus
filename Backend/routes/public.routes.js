// routes/public.routes.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const { validate } = require('../middleware/validation');
const { publicValidation } = require('../validations');
const { rateLimiter } = require('../middleware/rateLimiter');

// Home Page Data
router.get('/home', publicController.getHomePageData);
router.get('/hero-banner', publicController.getHeroBanner);
router.get('/featured-trainers', publicController.getFeaturedTrainers);
router.get('/testimonials', publicController.getTestimonials);
router.get('/partners', publicController.getPartners);

// Trainer Search & Discovery
router.get('/trainers/search', 
  validate(publicValidation.searchTrainers), 
  publicController.searchTrainers
);
router.get('/trainers/popular', publicController.getPopularTrainers);
router.get('/trainers/categories', publicController.getTrainerCategories);
router.get('/trainers/:trainerId', publicController.getTrainerProfile);
router.get('/trainers/:trainerId/packages', publicController.getTrainerPackages);
router.get('/trainers/:trainerId/reviews', publicController.getTrainerReviews);
router.get('/trainers/:trainerId/availability', publicController.getTrainerAvailability);

// Articles & Blog
router.get('/articles', 
  validate(publicValidation.getArticles), 
  publicController.getArticles
);
router.get('/articles/featured', publicController.getFeaturedArticles);
router.get('/articles/categories', publicController.getArticleCategories);
router.get('/articles/:slug', publicController.getArticleBySlug);
router.get('/articles/category/:category', publicController.getArticlesByCategory);
router.get('/articles/tags/:tag', publicController.getArticlesByTag);
router.post('/articles/:articleId/view', publicController.incrementArticleView);

// Events
router.get('/events', 
  validate(publicValidation.getEvents), 
  publicController.getEvents
);
router.get('/events/upcoming', publicController.getUpcomingEvents);
router.get('/events/categories', publicController.getEventCategories);
router.get('/events/:eventId', publicController.getEventDetails);
router.post('/events/:eventId/register', 
  rateLimiter,
  validate(publicValidation.registerForEvent), 
  publicController.registerForEvent
);

// Gym & Fitness Centers
router.get('/gyms/search', 
  validate(publicValidation.searchGyms), 
  publicController.searchGyms
);
router.get('/gyms/nearby', 
  validate(publicValidation.getNearbyGyms), 
  publicController.getNearbyGyms
);
router.get('/gyms/:gymId', publicController.getGymDetails);
router.get('/gyms/:gymId/trainers', publicController.getGymTrainers);
router.get('/gyms/:gymId/reviews', publicController.getGymReviews);

// Contact & Support
router.post('/contact', 
  rateLimiter,
  validate(publicValidation.submitContactForm), 
  publicController.submitContactForm
);
router.post('/newsletter/subscribe', 
  rateLimiter,
  validate(publicValidation.subscribeNewsletter), 
  publicController.subscribeNewsletter
);
router.post('/newsletter/unsubscribe', 
  validate(publicValidation.unsubscribeNewsletter), 
  publicController.unsubscribeNewsletter
);

// Trainer Application
router.post('/trainer/apply', 
  rateLimiter,
  validate(publicValidation.trainerApplication), 
  publicController.submitTrainerApplication
);
router.get('/trainer/application-status/:applicationId', publicController.checkApplicationStatus);

// Reviews & Ratings
router.get('/reviews/recent', publicController.getRecentReviews);
router.get('/reviews/stats', publicController.getReviewStats);

// Static Pages
router.get('/pages/:slug', publicController.getPageBySlug);
router.get('/faqs', publicController.getFAQs);
router.get('/faqs/categories', publicController.getFAQCategories);
router.get('/terms', publicController.getTermsOfService);
router.get('/privacy', publicController.getPrivacyPolicy);
router.get('/about', publicController.getAboutUs);

// Locations & Cities
router.get('/locations', publicController.getServiceLocations);
router.get('/locations/:city/trainers', publicController.getTrainersByCity);
router.get('/locations/popular', publicController.getPopularLocations);

// Statistics & Social Proof
router.get('/stats', publicController.getPlatformStats);
router.get('/success-stories', publicController.getSuccessStories);
router.get('/success-stories/:storyId', publicController.getSuccessStoryDetails);

// SEO & Sitemap
router.get('/sitemap', publicController.getSitemap);
router.get('/meta/:page', publicController.getPageMetadata);

// Package Information
router.get('/packages/popular', publicController.getPopularPackages);
router.get('/packages/categories', publicController.getPackageCategories);
router.get('/pricing-info', publicController.getPricingInfo);

// Health Check
router.get('/health', publicController.healthCheck);

// Search Suggestions
router.get('/search/suggestions', 
  validate(publicValidation.getSearchSuggestions), 
  publicController.getSearchSuggestions
);

// Language Support
router.get('/languages', publicController.getSupportedLanguages);
router.get('/translations/:lang', publicController.getTranslations);

module.exports = router;