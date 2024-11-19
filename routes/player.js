const express = require('express');
const protect = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = express.Router();

router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

router.get('/rankings', protect, async (req, res) => {
  try {
    const users = await User.find().sort({ clickCount: -1 }); 
    res.json(users);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
