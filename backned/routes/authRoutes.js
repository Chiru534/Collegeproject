import express from 'express';
import User from '../Models/user.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { roll, password } = req.body;
    const user = await User.findOne({ roll });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ 
      success: true,
      user: { roll: user.roll, isAdmin: user.isAdmin }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { roll, email, password } = req.body;
    // ...registration logic...
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Password reset middleware
const validateResetRequest = (req, res, next) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password || password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long'
    });
  }

  if (!token) {
    return res.status(400).json({
      error: 'Reset token is required'
    });
  }

  next();
};

// Reset password route
router.post('/reset-password/:token', validateResetRequest, async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: crypto
        .createHash('sha256')
        .update(token)
        .digest('hex'),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    await user.resetPassword(token, password);
    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({
      error: error.message || 'Password reset failed'
    });
  }
});

export default router;