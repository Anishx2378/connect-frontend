const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CATEGORIES

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, workspaceId } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ error: 'Name and workspaceId are required' });
    }

    const category = await prisma.knowledgeCategory.create({
      data: {
        name,
        description,
        icon,
        workspaceId
      },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    });

    res.status(201).json({ data: category });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A category with this name already exists in this workspace.' });
    }
    console.error('Error creating knowledge category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Get Categories
exports.getCategories = async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query parameter is required' });
    }

    const categories = await prisma.knowledgeCategory.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { articles: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const category = await prisma.knowledgeCategory.update({
      where: { id },
      data: { name, description, icon },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    });

    res.status(200).json({ data: category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.knowledgeCategory.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};


// ARTICLES

// Create Article
exports.createArticle = async (req, res) => {
  try {
    const { title, content, coverImage, tags, categoryId, workspaceId } = req.body;
    const authorId = req.user.id;

    if (!title || !content || !categoryId || !workspaceId) {
      return res.status(400).json({ error: 'Title, content, categoryId, and workspaceId are required' });
    }

    const article = await prisma.knowledgeArticle.create({
      data: {
        title,
        content,
        coverImage,
        tags: tags || [],
        categoryId,
        workspaceId,
        authorId
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    });

    // Create first history entry
    await prisma.knowledgeArticleHistory.create({
      data: {
        articleId: article.id,
        version: article.version,
        title: article.title,
        content: article.content,
        coverImage: article.coverImage,
        tags: article.tags,
        authorId
      }
    });

    res.status(201).json({ data: article });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
};

// Get Articles
exports.getArticles = async (req, res) => {
  try {
    const { workspaceId, categoryId, search, tags, limit } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query parameter is required' });
    }

    const where = { workspaceId };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (tags) {
      const tagsArray = tags.split(',').map(t => t.trim());
      where.tags = { hasSome: tagsArray };
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        category: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: limit ? parseInt(limit) : undefined
    });

    res.status(200).json({ data: articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

// Get Article by ID
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.knowledgeArticle.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        category: {
          select: { id: true, name: true }
        },
        history: {
          orderBy: { version: 'desc' },
          include: {
            author: { select: { id: true, name: true } }
          }
        },
        favorites: {
          where: { userId: req.user.id }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const isFavorited = article.favorites.length > 0;

    res.status(200).json({ data: { ...article, isFavorited } });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
};

// Update Article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, coverImage, tags, categoryId } = req.body;
    const authorId = req.user.id;

    // Fetch current to increment version
    const current = await prisma.knowledgeArticle.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const nextVersion = current.version + 1;

    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        title,
        content,
        coverImage,
        tags,
        categoryId,
        version: nextVersion
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    });

    // Save history
    await prisma.knowledgeArticleHistory.create({
      data: {
        articleId: article.id,
        version: article.version,
        title: article.title,
        content: article.content,
        coverImage: article.coverImage,
        tags: article.tags,
        authorId
      }
    });

    res.status(200).json({ data: article });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

// Delete Article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.knowledgeArticle.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};

// Toggle Favorite
exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.knowledgeFavorite.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId: id
        }
      }
    });

    if (existing) {
      await prisma.knowledgeFavorite.delete({
        where: {
          userId_articleId: {
            userId,
            articleId: id
          }
        }
      });
      res.status(200).json({ data: { isFavorited: false } });
    } else {
      await prisma.knowledgeFavorite.create({
        data: {
          userId,
          articleId: id
        }
      });
      res.status(200).json({ data: { isFavorited: true } });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

// Get Favorites
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.query;

    const favorites = await prisma.knowledgeFavorite.findMany({
      where: {
        userId,
        article: { workspaceId }
      },
      include: {
        article: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            },
            category: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ data: favorites.map(f => f.article) });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};
