// controllers/accountsController.js
const Account = require('../models/Account');

async function getAccounts(req, res, next) {
  try {
    const accounts = await Account.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: accounts });
  } catch (err) { next(err); }
}

async function updateAccount(req, res, next) {
  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, upsert: false }
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (err) { next(err); }
}

module.exports = { getAccounts, updateAccount };
