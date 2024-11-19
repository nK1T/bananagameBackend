const express = require('express');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const router = express.Router();


router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({ role: 'player' });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/block/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.blocked = !user.blocked;
    await user.save();
    res.json({ message: `User ${user.blocked ? 'blocked' : 'unblocked'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
