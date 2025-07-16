// routes/content.routes.js
const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public content routes
router.get('/articles', contentController.getPublicArticles);
router.get('/articles/:slug', contentController.getArticleBySlug);
router.get('/articles/category/:category', contentController.getArticlesByCategory);
router.get('/articles/tag/:tag', contentController.getArticlesByTag);

// News routes
router.get('/news', contentController.getPublicNews);
router.get('/news/:slug', contentController.getNewsBySlug);
router.get('/news/category/:category', contentController.getNewsByCategory);

// Pages routes
router.get('/pages/:slug', contentController.getPageBySlug);
router.get('/pages', contentController.getPublicPages);

// Categories and tags
router.get('/categories', contentController.getCategories);
router.get('/tags', contentController.getTags);

// Featured content
router.get('/featured/articles', contentController.getFeaturedArticles);
router.get('/featured/news', contentController.getFeaturedNews);

// Search content
router.get('/search', contentController.searchContent);

// Admin content management
router.get('/admin/articles', [auth, adminAuth], contentController.getAllArticles);
router.post('/admin/articles', [auth, adminAuth], contentController.createArticle);
router.put('/admin/articles/:id', [auth, adminAuth], contentController.updateArticle);
router.delete('/admin/articles/:id', [auth, adminAuth], contentController.deleteArticle);
router.get('/admin/articles/:id', [auth, adminAuth], contentController.getArticleById);

// Admin news management
router.get('/admin/news', [auth, adminAuth], contentController.getAllNews);
router.post('/admin/news', [auth, adminAuth], contentController.createNews);
router.put('/admin/news/:id', [auth, adminAuth], contentController.updateNews);
router.delete('/admin/news/:id', [auth, adminAuth], contentController.deleteNews);
router.get('/admin/news/:id', [auth, adminAuth], contentController.getNewsById);

// Admin pages management
router.get('/admin/pages', [auth, adminAuth], contentController.getAllPages);
router.post('/admin/pages', [auth, adminAuth], contentController.createPage);
router.put('/admin/pages/:id', [auth, adminAuth], contentController.updatePage);
router.delete('/admin/pages/:id', [auth, adminAuth], contentController.deletePage);

// Categories management
router.post('/admin/categories', [auth, adminAuth], contentController.createCategory);
router.put('/admin/categories/:id', [auth, adminAuth], contentController.updateCategory);
router.delete('/admin/categories/:id', [auth, adminAuth], contentController.deleteCategory);

// Tags management
router.post('/admin/tags', [auth, adminAuth], contentController.createTag);
router.put('/admin/tags/:id', [auth, adminAuth], contentController.updateTag);
router.delete('/admin/tags/:id', [auth, adminAuth], contentController.deleteTag);

// Content status management
router.put('/admin/articles/:id/publish', [auth, adminAuth], contentController.publishArticle);
router.put('/admin/articles/:id/unpublish', [auth, adminAuth], contentController.unpublishArticle);
router.put('/admin/news/:id/publish', [auth, adminAuth], contentController.publishNews);
router.put('/admin/news/:id/unpublish', [auth, adminAuth], contentController.unpublishNews);

// Content analytics
router.get('/admin/analytics', [auth, adminAuth], contentController.getContentAnalytics);
router.get('/admin/popular', [auth, adminAuth], contentController.getPopularContent);

module.exports = router;
