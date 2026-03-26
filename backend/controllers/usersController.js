// controllers/usersController.js
const User = require('../models/User');

async function getUsers(req, res, next) {
  try {
    const users = await User.find({ isActive: true }).select('-password').sort({ name: 1 }).lean();
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: { ...user.toJSON(), password: undefined } });
  } catch (err) { next(err); }
}

async function updateUser(req, res, next) {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { $set: rest }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (err) { next(err); }
}

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
