import express from 'express';
import { configDotenv } from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { processPdf } from './pdfProcessor.js'; // import processing function
import connectToDB from './Config/ConnectToDB.js';
import Student, { getStudentModel } from './Models/student.js'; // (if not already imported)
import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import resultRoutes from './routes/results.js';


configDotenv();
connectToDB(); // Only call this ONCE, here!

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET','POST']
}));

// Ensure "uploads" folder exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Uploads folder created at:', uploadDir);
}

// Set up multer storage.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Global in-memory store for progress updates.
const progressStore = {};

// POST /upload – upload file and start processing.
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
          return res.status(400).send('No file uploaded.');
        }
        
        // Generate a processId (for example, using the current timestamp).
        const processId = Date.now().toString();
        const filePath = req.file.path;
        const semester = req.body.semester;
        
        console.log('File received:', req.file.filename, 'for semester:', semester);
        
        // Initialize progress for this process.
        progressStore[processId] = { progress: {}, completed: false };
        
        // Trigger PDF processing in background.
        processPdf(filePath, semester, (progressData) => {
           // Update progress in the store.
           progressStore[processId].progress = progressData;
        })
        .then(summary => {
           progressStore[processId].summary = summary;
           progressStore[processId].completed = true;
        })
        .catch(error => {
          console.error('Error in /upload:', error);
           progressStore[processId].error = error.message;
           progressStore[processId].completed = true;
        });
        
        // Respond immediately with the processId.
        res.json({ processId });
    } catch (error) {
        console.error('Error in /upload:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /progress – SSE endpoint for clients to receive progress updates.
app.get('/progress', (req, res) => {
    const processId = req.query.pid;
    if (!processId || !progressStore[processId]) {
      return res.status(404).send('Process not found');
    }
    
    // Set SSE headers.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send updates every second.
    const interval = setInterval(() => {
      const progressData = progressStore[processId].progress;
      res.write(`data: ${JSON.stringify({ progress: progressData })}\n\n`);
      
      // If processing is complete, send a final event.
      if (progressStore[processId].completed) {
        if (progressStore[processId].error) {
          res.write(`event: error\ndata: ${JSON.stringify({ message: progressStore[processId].error })}\n\n`);
        } else {
          res.write(`event: complete\ndata: ${JSON.stringify({ summary: progressStore[processId].summary, message: 'File processed successfully.' })}\n\n`);
        }
        clearInterval(interval);
        res.end();
      }
    }, 1000);
});

// GET /result/:roll – fetch student result by roll number
app.get('/result/:roll', async (req, res) => {
  const roll = req.params.roll.trim();
  try {
    const student = await Student.findOne({ roll });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add the results endpoint
app.get('/api/results/:semester/:roll', async (req, res) => {
  try {
    const { semester, roll } = req.params;
    console.log('Fetching result for:', semester, roll);

    const SemesterModel = getStudentModel(semester);
    
    // Find student in the semester-specific collection
    const result = await SemesterModel.findOne({ roll });

    if (!result) {
      return res.status(404).json({
        message: `No result found for roll ${roll} in semester ${semester}`
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({
      message: 'Error fetching result',
      error: error.message
    });
  }
});

// 1. Verify auth routes in read.js
// import authRoutes from './routes/auth.js';
app.use('/auth', authRoutes);

// 2. Update user model to include reset token fields
// filepath: d:\drive-download-20250312T131825Z-001\backned\Models\user.js
const userSchema = new mongoose.Schema({
  // ...existing fields...
  roll: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  // Add reset token fields
  resetToken: String,
  resetTokenExpiry: Date
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/results', resultRoutes);

app.listen(5000, () => {
    console.log('Backend running at http://localhost:5000');
});