import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  isAdmin: { type: Boolean, default: false },
  // Reset token fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // OTP fields
  resetOTP: String,
  resetOTPExpires: Date
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add OTP generation method
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.resetOTP = otp;
  this.resetOTPExpires = Date.now() + 600000; // 10 minutes
  return otp;
};

// Create reset token method
userSchema.methods.createPasswordResetToken = function() {
  // Create reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and save to database
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Set expiry to 1 hour
  this.resetPasswordExpires = Date.now() + 3600000;
  
  return resetToken;
};

// Reset password method
userSchema.methods.resetPassword = async function(token, newPassword) {
  // Check if token exists and has not expired
  if (!this.resetPasswordToken || !this.resetPasswordExpires) {
    throw new Error('Invalid or expired reset token');
  }

  // Check if token has expired
  if (Date.now() > this.resetPasswordExpires) {
    throw new Error('Reset token has expired');
  }

  // Verify token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  if (this.resetPasswordToken !== hashedToken) {
    throw new Error('Invalid reset token');
  }

  // Update password
  this.password = newPassword;
  
  // Clear reset token fields
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;

  // Save the document
  await this.save();
};

export default mongoose.model('User', userSchema);