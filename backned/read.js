import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';
import { configDotenv } from 'dotenv';
import { connectToDB } from './Config/ConnectToDB.js';
import { processPdf } from './pdfProcessor.js'; // Add this import
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import jwt from 'jsonwebtoken';
import { getStudentModel } from './Models/student.js';

configDotenv();
connectToDB();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Use the routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// Upload directory setup
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Uploads folder created at:', uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage: storage });

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { semester } = req.body;
    if (!semester) {
      return res.status(400).json({ error: 'Semester is required' });
    }

    console.log('File received:', req.file.filename, 'for semester:', semester);

    const result = await processPdf(req.file.path, semester, req.file.filename);
    
    res.json({
      success: true,
      message: 'File processed successfully',
      details: result
    });

  } catch (error) {
    console.error('Error in /upload:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process file'
    });
  }
});

// Progress tracking store
const progressStore = {};

// Progress monitoring endpoint
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

// Basic result fetch endpoint
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

// Semester specific result endpoint
app.get('/api/results/:semester/:roll', async (req, res) => {
  try {
    const { semester, roll } = req.params;
    console.log('Fetching result for:', semester, roll);

    const SemesterModel = getStudentModel(semester);
    
    // Find student in the semester-specific collection.
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

// Update the semester specific result endpoint
app.get('/auth/results/:roll/:semester', async (req, res) => {
  try {
    const { roll, semester } = req.params;
    console.log('Fetching result for:', { roll, semester });

    // Get model for the specific semester collection
    const collectionName = `semester_${semester}`;
    const StudentModel = getStudentModel(collectionName);
    
    // Find the student's result
    const result = await StudentModel.findOne({ roll });
    
    if (!result) {
      console.log(`No results found in ${collectionName} for roll ${roll}`);
      return res.status(404).json({ 
        error: `No results found for roll ${roll} in semester ${semester}` 
      });
    }
    
    console.log(`Found result in ${collectionName} for roll ${roll}`);
    res.json(result);

  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ 
      error: 'Failed to fetch results',
      details: error.message 
    });
  }
});

// Protected all-semester results endpoint
app.get('/api/results/:roll', async (req, res) => {
  try {
    const { roll } = req.params;
    
    // Token verification
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.roll !== roll) {
      return res.status(403).json({ message: 'You can only view your own results' });
    }

    const results = {};
    const semesters = ["1_1", "1_2", "2_1", "2_2", "3_1", "3_2", "4_1", "4_2"];

    for (const semester of semesters) {
      const SemesterModel = getStudentModel(semester);
      const semesterResult = await SemesterModel.findOne({ roll });
      if (semesterResult) {
        results[semester] = semesterResult.subjects;
      }
    }

    if (Object.keys(results).length === 0) {
      return res.status(404).json({ message: `No results found for roll ${roll}` });
    }

    res.json({ roll, results });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      message: 'Error fetching results',
      error: error.message
    });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});