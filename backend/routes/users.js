// routes/users.js
const router = require('express').Router();
const c = require('../controllers/usersController');
router.get('/',       c.getUsers);
router.get('/:id',    c.getUser);
router.post('/',      c.createUser);
router.put('/:id',    c.updateUser);
router.delete('/:id', c.deleteUser);
module.exports = router;
