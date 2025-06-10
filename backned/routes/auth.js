import express from 'express';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import User from '../Models/user.js';
import Result from '../Models/result.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import update from '../Models/update.js';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

const router = express.Router();
const upload = multer();

// Ensure body parsing is enabled (if not enabled globally in your server file)
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Update nodemailer configuration for better reliability
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: 'leelamohankurmapu2004@gmail.com',
    pass: 'nbmj nfgt etno ogci'   // Use App Password, not regular password
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  pool: true, // Use connection pooling
  maxConnections: 3,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 3,
  socketTimeout: 30000 // 30 seconds
});

// Simplified connection verification
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP server connected');
    return true;
  } catch (error) {
    console.error('❌ SMTP Connection Error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      username: process.env.EMAIL_USER
    });
    return false;
  }
};

// Test connection immediately
verifyEmailConfig();

// Debug logger for auth routes
router.use((req, res, next) => {
  console.log('🔒 Auth Route:', {
    path: req.path,
    method: req.method,
    body: req.body
  });
  next();
});

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { roll, email, password } = req.body;

    // Validate input
    if (!roll || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user
    const existingUser = await User.findOne({ 
      $or: [{ roll }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this roll number or email'
      });
    }

    // Create new user
    const user = new User({
      roll,
      email,
      password
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login route - store roll number for result fetching
router.post('/login', async (req, res) => {
  try {
    const { roll, password } = req.body;
    console.log('👤 Login attempt for:', roll);

    const user = await User.findOne({ roll });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Store the roll number (username) in response
    res.json({
      success: true,
      user: {
        roll: user.roll,  // This will be used for fetching results
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update the sendEmailWithRetry function
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempting to send email (attempt ${attempt}/${maxRetries})`);
      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully');
      return true;
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, {
        error: error.message,
        code: error.code,
        command: error.command
      });
      
      if (attempt === maxRetries) throw error;
      
      const delay = 2000 * attempt;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Forgot password route with OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Forgot password request for:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Generate OTP using the existing method
    const otp = user.generateOTP();
    await user.save();

    try {
      await sendEmailWithRetry({
        to: user.email,
        subject: 'Password Reset OTP',
        html: `
          <h1>Password Reset OTP</h1>
          <p>Your OTP for password reset is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        `,
        headers: {
          priority: 'high'
        }
      });

      res.json({
        success: true,
        message: 'OTP sent to your email'
      });
    } catch (emailError) {
      // Rollback OTP if email fails
      user.resetOTP = undefined;
      user.resetOTPExpires = undefined;
      await user.save();

      console.error('📧 Email error details:', {
        error: emailError.message,
        code: emailError.code,
        command: emailError.command
      });

      throw new Error('Failed to send OTP email');
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// Reset password with verification flow
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ 
      email,
      resetOTP: otp,
      resetOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Create reset token after OTP verification
    const resetToken = user.createPasswordResetToken();
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP' 
    });
  }
});

// Reset password route
router.post('/reset-password/:token', async (req, res) => {
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
        success: false,
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
      success: false,
      error: error.message
    });
  }
});

// Add connection retry logic
const connectSMTP = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Attempting SMTP connection (${attempt}/${retries})`);
      await transporter.verify();
      console.log('✅ SMTP server connected successfully');
      return true;
    } catch (error) {
      console.error(`❌ SMTP connection attempt ${attempt} failed:`, {
        error: error.message,
        code: error.code,
        command: error.command
      });
      
      if (attempt === retries) {
        console.error('❌ All SMTP connection attempts failed');
        return false;
      }
      
      const delay = 2000 * attempt;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Initialize SMTP connection
connectSMTP();

// Get results route with collection-based querying
router.get('/results/:roll/:semester', async (req, res) => {
  try {
    const { roll, semester } = req.params;
    console.log('🔍 Searching for results:', { roll, semester });

    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready');
    }

    // Handle 'All' semester request
    if (semester.toLowerCase() === 'all') {
      const allResults = [];
      const semesterCollections = [
        'semester_1_1', 'semester_1_2',
        'semester_2_1', 'semester_2_2',
        'semester_3_1', 'semester_3_2',
        'semester_4_1', 'semester_4_2'
      ];

      // Query each collection
      for (const collectionName of semesterCollections) {
        try {
          const collection = mongoose.connection.db.collection(collectionName);
          const semesterResults = await collection.find({ roll }).toArray();
          if (semesterResults.length > 0) {
            allResults.push({
              semester: collectionName.replace('semester_', '').replace('_', '-'),
              results: semesterResults
            });
          }
        } catch (err) {
          console.warn(`⚠️ No results in ${collectionName}:`, err.message);
        }
      }

      if (allResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No results found for ${roll}`
        });
      }

      return res.json({
        success: true,
        data: allResults
      });
    }

    // Handle single semester request
    const formattedSemester = semester.replace('-', '_');
    const collectionName = `semester_${formattedSemester}`;
    
    console.log('📚 Querying collection:', collectionName);
    
    const collection = mongoose.connection.db.collection(collectionName);
    const results = await collection.find({ roll }).toArray();

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No results found for ${roll} in semester ${semester}`
      });
    }

    console.log('✅ Found results in collection:', collectionName);
    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ Error fetching results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch results'
    });
  }
});

// ----- Added Update Route (Upload Updates) -----
// This route creates a new update and sends an email notification to all users
router.post('/upload-updates', upload.none(), async (req, res) => {
  const { title, description, date } = req.body;

  // Validate required fields
  if (!title || !description || !date) {
    return res.status(400).json({
      success: false,
      error: 'Title, description, and date are required'
    });
  }

  try {
    // Create a new update document using the update model
    const newUpdate = await update.create({
      title,
      description,
      date
    });
    
    // Fetch all users' emails (adjust the query as needed)
    const users = await User.find({}, 'email');
    const recipientEmails = users
      .map(user => user.email)
      .filter(Boolean)
      .join(',');

    // Setup mail options for email notification
    const mailOptions = {
      from: transporter.options.auth.user,
      to: recipientEmails,
      subject: 'New Update Posted',
      text: `A new update has been posted:
      
Title: ${newUpdate.title}
Description: ${newUpdate.description}
Date: ${newUpdate.date}

Regards,
Your Application`
    };

    // Send email notification
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Respond with the newly created update document
    return res.status(201).json({
      success: true,
      data: newUpdate
    });
  } catch (error) {
    console.error('Error creating update:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// ----- Get Updates Route -----
// This route retrieves all update documents from the database
router.get('/updates', async (req, res) => {
  try {
    const updates = await update.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: updates
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    // For example, fetch the user by a specific criteria
    const user = await User.findOne({});
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        roll: user.roll,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Admin routes
// ----- Get Students Route -----
// This route retrieves all student users
router.get('/students', async (req, res) => {
  try {
    // Query for all students
    // Optionally filter by isAdmin flag if needed: { isAdmin: false }
    const students = await User.find({});
    return res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// ----- Update Student Route -----
// This route updates a student's data
router.put('/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body; // Expect fields like name, email, roll
    
    // Find the student by ID and update with validation (new option returns updated document)
    const updatedStudent = await User.findByIdAndUpdate(studentId, updateData, {
      new: true,
      runValidators: true
    });
    
    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;