// routes/accounts.js
const router = require('express').Router();
const c = require('../controllers/accountsController');
router.get('/',       c.getAccounts);
router.put('/:id',    c.updateAccount);
module.exports = router;
