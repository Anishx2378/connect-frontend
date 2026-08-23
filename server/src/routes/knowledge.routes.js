const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge.controller');
const auth = require('../middleware/auth');

// Protect all knowledge routes
router.use(auth);

// Categories
router.post('/categories', knowledgeController.createCategory);
router.get('/categories', knowledgeController.getCategories);
router.patch('/categories/:id', knowledgeController.updateCategory);
router.delete('/categories/:id', knowledgeController.deleteCategory);

// Articles
router.post('/articles', knowledgeController.createArticle);
router.get('/articles', knowledgeController.getArticles);
router.get('/favorites', knowledgeController.getFavorites); // Note: defined before /articles/:id to avoid conflict
router.get('/articles/:id', knowledgeController.getArticleById);
router.patch('/articles/:id', knowledgeController.updateArticle);
router.delete('/articles/:id', knowledgeController.deleteArticle);
router.post('/articles/:id/favorite', knowledgeController.toggleFavorite);

module.exports = router;
