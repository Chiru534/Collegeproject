import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Students.css';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // Fetch students list from the backend
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/students');
        if (response.data.success) {
          setStudents(response.data.data);
        } else {
          setError('Failed to fetch students');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // When admin clicks "Edit" button, open the update modal

  if (loading) {
    return <div>Loading students...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="students-container">
      <h1>Students List</h1>
      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <table className="students-table">
          <thead>
            <tr>
              <th>Roll</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id}>
                <td>{student.roll}</td>
                <td>{student.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}

export default Students;