import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  roll: {
    type: String,
    required: true,
    index: true
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

// Create models for each semester
const semesterCollections = [
  'semester_1_1', 'semester_1_2',
  'semester_2_1', 'semester_2_2',
  'semester_3_1', 'semester_3_2',
  'semester_4_1', 'semester_4_2'
];

const SemesterModels = {};

semesterCollections.forEach(collectionName => {
  SemesterModels[collectionName] = mongoose.model(
    collectionName,
    resultSchema,
    collectionName
  );
});

export default SemesterModels;