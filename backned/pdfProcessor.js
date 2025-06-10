import fs from 'fs';
import pdf2table from 'pdf2table';
import { getStudentModel } from './Models/student.js';

export async function processPdf(filePath, semester, processId) {
  // Validate semester
  if (!semester || typeof semester !== 'string') {
    throw new Error('Invalid semester format');
  }

  // Format semester for collection name
  const formattedSemester = semester.replace('-', '_');
  
  const isValidSubject = (subject) => {
    const isValid =
      subject.subjectCode &&
      subject.subjectCode.startsWith('R') &&
      subject.subjectName &&
      subject.subjectName.length > 0 &&
      typeof subject.internal === 'number' &&
      !isNaN(subject.internal) &&
      subject.grade &&
      subject.grade.length > 0 &&
      typeof subject.credits === 'number' &&
      !isNaN(subject.credits) &&
      subject.status &&
      ['Pass', 'Fail'].includes(subject.status);

    if (!isValid) {
      console.error('❌ Invalid subject data:', subject);
    }

    return isValid;
  };

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (readErr, buffer) => {
      if (readErr) {
        console.error('File read error:', readErr);
        return reject(readErr);
      }

      pdf2table.parse(buffer, async (parseErr, rows) => {
        try {
          console.log('Initial rows:', rows.slice(0, 3));

          let startIndex = -1;
          let hasSNO = false;

          for (let i = 0; i < rows.length; i++) {
            if (Array.isArray(rows[i])) {
              const headerRow = rows[i].map(col => String(col || '').toLowerCase());
              if (headerRow.some(col => col.includes('htno')) ||
                  headerRow.some(col => col.includes('subcode'))) {
                startIndex = i;
                hasSNO = headerRow[0] === 'sno' || headerRow[0].includes('serial');
                console.log('Header found at:', i, 'Has SNO:', hasSNO);
                break;
              }
            }
          }

          if (startIndex === -1) {
            return reject(new Error('Invalid PDF format: No header row found'));
          }

          rows = rows.slice(startIndex + 1);
          let processedCount = 0;
          let skippedCount = 0;
          // Get the model with formatted semester
          const StudentModel = getStudentModel(formattedSemester);

          for (const row of rows) {
            try {
              if (!Array.isArray(row)) continue;

              const offset = hasSNO ? 1 : 0;
              const roll = String(row[offset]).trim();

              if (!roll.includes('HN')) {
                skippedCount++;
                continue;
              }

              const subject = {
                subjectCode: String(row[offset + 1] || '').trim(),
                subjectName: String(row[offset + 2] || '').trim(),
                internal: parseInt(row[offset + 3]) || 0,
                grade: String(row[offset + 4] || '').trim().toUpperCase(),
                credits: parseFloat(row[offset + 5]) || 0,
                status: ['F', 'ABSENT', 'MP'].includes(String(row[offset + 4] || '').trim().toUpperCase()) ? 'Fail' : 'Pass'
              };

              if (!isValidSubject(subject)) {
                console.error('Invalid subject data:', subject);
                skippedCount++;
                continue;
              }

              console.log(`Processing: ${roll} - ${subject.subjectCode}`);

              // Log the complete subject object before insertion
              console.log('Subject to be inserted:', JSON.stringify(subject, null, 2));

              // Use updateOne with $set and $push to ensure all fields are saved
              const result = await StudentModel.updateOne(
                { roll, semester }, // Add semester to query
                {
                  $set: { 
                    roll,
                    semester 
                  },
                  $push: { 
                    subjects: subject 
                  }
                },
                { upsert: true, new: true, runValidators: true }
              );

              // Log the result of the update operation
              console.log('Update result:', JSON.stringify(result, null, 2));

              if (result.modifiedCount === 0 && result.upsertedCount === 0) {
                console.error(`Failed to update/insert subject for roll ${roll}, subjectCode: ${subject.subjectCode}`);
              }

              processedCount++;

            } catch (rowError) {
              console.error('Row processing error:', rowError);
              skippedCount++;
            }
          }

          resolve({ processedCount, skippedCount, success: true });

        } catch (error) {
          console.error('Processing error:', error);
          reject(error);
        }
      });
    });
  });
}