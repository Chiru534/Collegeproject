import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  internal: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pass', 'Fail']
  }
}, { _id: true });

const studentSchema = new mongoose.Schema({
  roll: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  subjects: [subjectSchema]
}, {
  versionKey: false,
  strict: false
});

// Create a single model for all students
const Student = mongoose.model('Student', studentSchema);

export const getStudentModel = (semester) => {
  if (!semester || typeof semester !== 'string') {
    throw new Error('Semester must be a valid string');
  }

  // Format the collection name
  const collectionName = `semester_${semester.replace('-', '_')}`;
  
  // For debugging
  console.log('Creating model with collection name:', collectionName);
  
  return mongoose.models[collectionName] || mongoose.model(collectionName, studentSchema);
};