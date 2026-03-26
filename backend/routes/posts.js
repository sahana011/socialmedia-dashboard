// routes/posts.js
const router = require('express').Router();
const c = require('../controllers/postsController');

router.get('/',            c.getPosts);
router.get('/:id',         c.getPost);
router.post('/',           c.createPost);
router.post('/bulk-delete',c.bulkDeletePosts);
router.put('/:id',         c.updatePost);
router.delete('/:id',      c.deletePost);

module.exports = router;
