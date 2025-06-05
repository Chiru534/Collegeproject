import fs from 'fs';
import pdf2table from 'pdf2table';
import { getStudentModel } from './Models/student.js';

export async function processPdf(filePath, semester, processId) {
  return new Promise((resolve, reject) => {
    // Emit initial status
    if (global.progressStore?.[processId]) {
      global.progressStore[processId].status = 'Processing PDF...';
    }

    fs.readFile(filePath, (readErr, buffer) => {
      if (readErr) {
        console.error('File read error:', readErr);
        if (global.progressStore?.[processId]) {
          global.progressStore[processId].status = 'Error reading PDF';
        }
        return reject(readErr);
      }

      pdf2table.parse(buffer, async (parseErr, rows) => {
        try {
          // Update status for parsing
          if (global.progressStore?.[processId]) {
            global.progressStore[processId].status = 'Extracting data from PDF...';
          }

          // Debug log initial rows
          console.log('Initial rows:', rows.slice(0, 3));

          // Find header row and detect SNO column
          let startIndex = -1;
          let hasSNO = false;

          for (let i = 0; i < rows.length; i++) {
            if (Array.isArray(rows[i])) {
              const headerRow = rows[i].map(col => String(col || '').toLowerCase());
              if (headerRow.some(col => col.includes('htno')) || 
                  headerRow.some(col => col.includes('subcode'))) {
                startIndex = i;
                // Check if first column is SNO
                hasSNO = headerRow[0] === 'sno' || headerRow[0].includes('serial');
                console.log('Header found at:', i, 'Has SNO:', hasSNO);
                break;
              }
            }
          }

          if (startIndex === -1) {
            return reject(new Error('Invalid PDF format: No header row found'));
          }

          // Process rows after header
          rows = rows.slice(startIndex + 1);
          let studentResults = {};
          let processedCount = 0;
          let skippedCount = 0;

          // Process each row with SNO handling
          for (const row of rows) {
            try {
              if (!Array.isArray(row)) continue;

              // Get column indices based on SNO presence
              const offset = hasSNO ? 1 : 0;
              const roll = String(row[offset]).trim();
              
              // Skip if not a valid roll number
              if (!roll.includes('HN')) {
                skippedCount++;
                continue;
              }

              const subject = {
                subjectCode: String(row[offset + 1]).trim(),
                subjectName: String(row[offset + 2]).trim(),
                internal: parseInt(row[offset + 3]) || 0,
                grade: String(row[offset + 4]).trim().toUpperCase(),
                credits: parseFloat(row[offset + 5]) || 0,
                status: ['F', 'ABSENT', 'MP'].includes(
                  String(row[offset + 4]).trim().toUpperCase()
                ) ? 'Fail' : 'Pass'
              };

              // Validate subject code
              if (!subject.subjectCode.startsWith('R')) {
                skippedCount++;
                continue;
              }

              if (!studentResults[roll]) {
                studentResults[roll] = [];
              }

              // Add subject if not duplicate
              if (!studentResults[roll].some(s => s.subjectCode === subject.subjectCode)) {
                studentResults[roll].push(subject);
                processedCount++;
                console.log(`Processed: ${roll} - ${subject.subjectCode}`);
              }

            } catch (rowError) {
              console.error('Row processing error:', rowError);
              skippedCount++;
            }
          }

          // Save to database if we have valid data
          if (Object.keys(studentResults).length === 0) {
            return reject(new Error('No valid results found'));
          }

          // Update status for processing
          if (global.progressStore?.[processId]) {
            global.progressStore[processId].status = 'Processing results...';
          }

          try {
            const SemesterModel = getStudentModel(semester);
            let savedCount = 0;

            // Update status for database operations
            if (global.progressStore?.[processId]) {
              global.progressStore[processId].status = 'Saving to database...';
            }

            for (const roll in studentResults) {
              await SemesterModel.findOneAndUpdate(
                { roll },
                { roll, subjects: studentResults[roll] },
                { upsert: true, new: true }
              );
              savedCount++;
              console.log(`Saved ${roll} with ${studentResults[roll].length} subjects`);
            }

            // After successful database save
            if (global.progressStore?.[processId]) {
              global.progressStore[processId].status = 'PDF processed successfully! ✅';
              global.progressStore[processId].progress = 100;
              global.progressStore[processId].success = true;
            }

            resolve({
              totalRows: rows.length,
              processedCount,
              skippedCount,
              savedCount,
              success: true,
              message: 'PDF processed successfully!'
            });

          } catch (dbError) {
            console.error('Database error:', dbError);
            if (global.progressStore?.[processId]) {
              global.progressStore[processId].status = 'Error processing PDF';
            }
            reject(dbError);
          }

        } catch (error) {
          console.error('Processing error:', error);
          if (global.progressStore?.[processId]) {
            global.progressStore[processId].status = 'Error processing PDF';
          }
          reject(error);
        }
      });
    });
  });
}