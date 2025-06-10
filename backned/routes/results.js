import express from 'express';
import { getStudentModel } from '../Models/student.js';

const router = express.Router();

// GET result by roll and semester
router.get('/auth/results/:roll/:semester', async (req, res) => {
  try {
    const { roll, semester } = req.params;
    console.log('Requesting results for:', { roll, semester }); // Debug log

    // Get model for the specific semester collection
    const collectionName = `semester_${semester}`;
    const StudentModel = getStudentModel(collectionName);
    
    // Find the student's result in the semester-specific collection
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

export default router;