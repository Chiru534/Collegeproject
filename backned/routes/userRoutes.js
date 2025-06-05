import express from 'express';
import User from '../Models/user.js';

const router = express.Router();

// Example: Get user profile by roll number
router.get('/profile/:roll', async (req, res) => {
  try {
    const user = await User.findOne({ roll: req.params.roll }, '-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Example: Update user profile by roll number
router.put('/update/:roll', async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { roll: req.params.roll },
      { $set: req.body },
      { new: true, fields: '-password' }
    );
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;