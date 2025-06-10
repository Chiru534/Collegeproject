import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  roll: {
    type: String,
    required: true,
    index: true
  },
  semester: {
    type: String,
    required: true
  },
  studentName: String,
  subjects: [{
    code: String,
    name: String,
    grade: String,
    credits: Number
  }],
  sgpa: Number,
  totalCredits: Number,
  examDate: Date
});

// Create a single model for all results
const Result = mongoose.model('Result', resultSchema);

export default Result;