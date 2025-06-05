import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  roll: { 
    type: String, 
    required: true,
    unique: true 
  },
  subjects: [{
    subjectCode: String,
    subjectName: String,
    internal: Number,
    grade: String,
    credits: Number,
    status: String
  }]
});

// Function to get model for specific semester
export function getStudentModel(semester) {
  // Convert semester like "1-2" to "semester_1_2"
  const collectionName = `semester_${semester.replace('-', '_')}`;
  return mongoose.models[collectionName] || mongoose.model(collectionName, studentSchema);
}

export default studentSchema;