// controllers/postsController.js
const Post = require('../models/Post');

// GET /api/posts?page=Main&status=Posted&from=...&to=...
async function getPosts(req, res, next) {
  try {
    const query = {};
    if (req.query.page)   query.page   = req.query.page;
    if (req.query.status) query.status = req.query.status;
    if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

    if (req.query.from || req.query.to) {
      query.postDate = {};
      if (req.query.from) query.postDate.$gte = new Date(req.query.from);
      if (req.query.to)   query.postDate.$lte = new Date(req.query.to);
    }

    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      query.$or = [{ sku: re }, { desc: re }];
    }

    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/:id
async function getPost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

// POST /api/posts
async function createPost(req, res, next) {
  try {
    const post = await Post.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

// PUT /api/posts/:id
async function updatePost(req, res, next) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/:id
async function deletePost(req, res, next) {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/posts/bulk  — body: { ids: [...] }
async function bulkDeletePosts(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, message: 'ids array required' });
    const result = await Post.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPosts, getPost, createPost, updatePost, deletePost, bulkDeletePosts };
