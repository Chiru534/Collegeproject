import express from 'express';
import { getStudentModel } from '../Models/student.js';

const router = express.Router();

// GET result by semester and roll
router.get('/api/results/:semester/:roll', async (req, res) => {
  try {
    const { semester, roll } = req.params;
    console.log('Fetching result for semester:', semester, 'roll:', roll);

    // Get the semester-specific model
    const SemesterModel = getStudentModel(semester);
    
    // Find student by roll in the semester collection
    const student = await SemesterModel.findOne({ roll });
    
    if (!student) {
      console.log('No result found for roll:', roll, 'semester:', semester);
      return res.status(404).json({ 
        message: `No result found for roll ${roll} in semester ${semester}` 
      });
    }

    console.log('Found result for roll:', roll, 'semester:', semester);
    res.json(student);

  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ 
      message: 'Error fetching result',
      error: error.message 
    });
  }
});

export default router;